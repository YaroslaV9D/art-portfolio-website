// Built using Hyperiux Vault: https://vault.hyperiux.com
// Orbit Flip Slider source adapted for this Vite/React project.
import {useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react'
import {gsap} from 'gsap'
import {Flip} from 'gsap/Flip'

gsap.registerPlugin(Flip)

const MODES = [
  {key: 'flat', label: 'Flat'},
  {key: 'tilt', label: 'Tilt'},
  {key: 'ring', label: 'Ring'},
  {key: 'gallery', label: 'Gallery'},
]

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1100
const SMALL_MOBILE_BREAKPOINT = 520
const MOBILE_FLAT_RADIUS_X_SCALE = 0.55
const MOBILE_TILT_RADIUS_X_SCALE = 0.6
const MOBILE_TILT_RADIUS_Y_SCALE = 0.8
const MOBILE_GALLERY_SCALE = 0.6

const getResponsiveRingScale = (width) => {
  if (width <= SMALL_MOBILE_BREAKPOINT) return 0.48
  if (width < MOBILE_BREAKPOINT) return 0.58
  if (width <= TABLET_BREAKPOINT) return 0.76
  if (width <= 1366) return 0.9
  return 1
}

const degToRad = (deg) => (deg * Math.PI) / 180

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === 'undefined') return () => {}
      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      media.addEventListener('change', callback)
      return () => media.removeEventListener('change', callback)
    },
    () => (
      typeof window === 'undefined'
        ? false
        : window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    ),
    () => false,
  )
}

const getBaseOrbitRadius = (count, cardWidth, cardHeight, imageGap) => {
  const baseSpan = Math.max(cardWidth, cardHeight) + imageGap
  return Math.max((count * baseSpan) / (2 * Math.PI) * 0.62, baseSpan * 0.9)
}

const buildCoverflowLayout = (count, containerW, containerH, sizes, params) => {
  const cx = containerW / 2
  const camDist = params.radius * params.camDistFactor
  const tilt = degToRad(params.tiltDeg)
  const positionScaleStrength = params.positionScaleStrength ?? 1
  const sizeScaleStrength = params.sizeScaleStrength ?? 0.42

  return sizes.map((size, i) => {
    const thetaDeg = params.offsetDeg + (i / count) * 360
    const theta = degToRad(thetaDeg)
    const px = params.radius * Math.sin(theta)
    const pz0 = -params.radius * Math.cos(theta)
    const py = -pz0 * Math.sin(tilt)
    const pz = pz0 * Math.cos(tilt)
    const scale = Math.max(camDist / (camDist + pz), 0.05)
    const positionScale = 1 + (scale - 1) * positionScaleStrength
    const sizeScale = 1 + (scale - 1) * sizeScaleStrength

    return {
      x: cx + px * positionScale,
      y: containerH * params.anchorY + py * positionScale,
      width: size.w * sizeScale,
      height: size.h * sizeScale,
      zIndex: Math.round(scale * 1000) + 1,
    }
  })
}

const applyZRotation = (boxes, cx, cy, zDeg) => {
  if (!zDeg) return boxes

  const angle = degToRad(zDeg)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return boxes.map((box) => {
    const dx = box.x - cx
    const dy = box.y - cy

    return {
      ...box,
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    }
  })
}

const applyRadiusScale = (boxes, cx, cy, baseRadius, radiusX, radiusY) => {
  const sx = radiusX / baseRadius
  const sy = radiusY / baseRadius

  if (sx === 1 && sy === 1) return boxes

  return boxes.map((box) => ({
    ...box,
    x: cx + (box.x - cx) * sx,
    y: cy + (box.y - cy) * sy,
  }))
}

const applyUniformScale = (boxes, cx, cy, scale) => {
  if (scale === 1) return boxes

  return boxes.map((box) => ({
    ...box,
    x: cx + (box.x - cx) * scale,
    y: cy + (box.y - cy) * scale,
    width: box.width * scale,
    height: box.height * scale,
  }))
}

const applyTransform = (boxes, cx, cy, baseRadius, transform) => {
  const radiusScaled = applyRadiusScale(
    boxes,
    cx,
    cy,
    baseRadius,
    baseRadius * transform.radiusX,
    baseRadius * transform.radiusY,
  )
  const scaled = applyUniformScale(radiusScaled, cx, cy, transform.scale)
  return applyZRotation(scaled, cx, cy, transform.z)
}

const buildLayout = (
  mode,
  count,
  containerW,
  containerH,
  sizes,
  transforms,
  imageGap,
  rotationOffsetDeg = 0,
) => {
  const cx = containerW / 2
  const cy = containerH / 2
  const cardWidth = sizes[0]?.w ?? 90
  const cardHeight = sizes[0]?.h ?? 140
  const baseRadius = getBaseOrbitRadius(count, cardWidth, cardHeight, imageGap)

  if (mode === 'flat') {
    const flat = transforms.flat
    const rx = baseRadius * flat.radiusX
    const ry = baseRadius * flat.radiusY
    const boxes = sizes.map((size, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2 + degToRad(rotationOffsetDeg)
      return {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
        width: size.w,
        height: size.h,
        zIndex: i + 1,
      }
    })

    return applyUniformScale(boxes, cx, cy, flat.scale)
  }

  const transform = transforms[mode]
  const radius = mode === 'gallery' ? baseRadius * 1.55 : baseRadius * 1.12
  const anchorY = 0.5
  const camDistFactor = mode === 'gallery' ? 1.55 : 1.75
  const positionScaleStrength = mode === 'gallery' ? 0.28 : 0.45
  const sizeScaleStrength = mode === 'gallery' ? 0.16 : 0.42

  const boxes = buildCoverflowLayout(count, containerW, containerH, sizes, {
    radius,
    tiltDeg: transform.x,
    camDistFactor,
    offsetDeg: -90 + transform.y + rotationOffsetDeg,
    anchorY,
    positionScaleStrength,
    sizeScaleStrength,
  })

  const transformed = applyTransform(boxes, cx, containerH * anchorY, radius, transform)
  if (!transform.moveY) return transformed
  return transformed.map((box) => ({...box, y: box.y + transform.moveY}))
}

export default function OrbitFlipSlider({
  items = [],
  backgroundColor = 'transparent',
  imageWidth = 90,
  imageHeight = 140,
  imageGap = 0,
  enableHoverMovement = true,
  hoverMoveY = -8,
  perspectiveRotateValue = 180,
  perspectiveRotateDirection = 'right',
  rotate = true,
  rotateSpeed = 4,
  stopRotationOnHover = true,
  initialMode = 'ring',
  showModeControls = false,
  flatRadiusX = 1.6,
  flatRadiusY = 1.2,
  flatScale = 1,
  ringRotateX = 31,
  ringRotateY = 56,
  ringRotateZ = -25,
  ringRadiusX = 1.5,
  ringRadiusY = 1.2,
  ringScale = 1,
  tiltRotateX = 70,
  tiltRotateY = 0,
  tiltRotateZ = 0,
  tiltRadiusX = 1.9,
  tiltRadiusY = 1.5,
  tiltScale = 1.2,
  tiltMoveY = 300,
  galleryRotateX = 0,
  galleryRotateY = 0,
  galleryRotateZ = 0,
  galleryRadiusX = 1.3,
  galleryRadiusY = 1.5,
  galleryScale = 1.2,
  onItemOpen,
}) {
  const FLIP_DURATION_SECONDS = 0.9
  const trackRef = useRef(null)
  const cardsRef = useRef([])
  const trackSizeRef = useRef({width: 0, height: 0})
  const modeRef = useRef(initialMode)
  const isFlipAnimatingRef = useRef(false)
  const flipResumeTimeoutRef = useRef(null)
  const rotationOffsetRef = useRef(0)
  const hoveredCardCountRef = useRef(0)
  const [activeMode, setActiveMode] = useState(initialMode)
  const [hoveredItem, setHoveredItem] = useState(null)
  const reducedMotion = usePrefersReducedMotion()

  const itemsKey = useMemo(
    () => items.map((item, index) => item.id ?? item.slug ?? index).join('|'),
    [items],
  )

  useEffect(() => {
    setHoveredItem(null)
    hoveredCardCountRef.current = 0
    cardsRef.current = cardsRef.current.slice(0, items.length)
  }, [itemsKey, items.length])

  const sizes = useMemo(
    () => items.map(() => ({w: imageWidth, h: imageHeight})),
    [items.length, imageWidth, imageHeight],
  )

  const transforms = useMemo(() => ({
    flat: {
      radiusX: flatRadiusX,
      radiusY: flatRadiusY,
      scale: flatScale,
    },
    tilt: {
      x: tiltRotateX,
      y: tiltRotateY,
      z: tiltRotateZ,
      radiusX: tiltRadiusX,
      radiusY: tiltRadiusY,
      scale: tiltScale,
      moveY: tiltMoveY,
    },
    ring: {
      x: ringRotateX,
      y: ringRotateY,
      z: ringRotateZ,
      radiusX: ringRadiusX,
      radiusY: ringRadiusY,
      scale: ringScale,
      moveY: 0,
    },
    gallery: {
      x: galleryRotateX,
      y: galleryRotateY,
      z: galleryRotateZ,
      radiusX: galleryRadiusX,
      radiusY: galleryRadiusY,
      scale: galleryScale,
      moveY: 0,
    },
  }), [
    flatRadiusX,
    flatRadiusY,
    flatScale,
    ringRotateX,
    ringRotateY,
    ringRotateZ,
    ringRadiusX,
    ringRadiusY,
    ringScale,
    tiltRotateX,
    tiltRotateY,
    tiltRotateZ,
    tiltRadiusX,
    tiltRadiusY,
    tiltScale,
    tiltMoveY,
    galleryRotateX,
    galleryRotateY,
    galleryRotateZ,
    galleryRadiusX,
    galleryRadiusY,
    galleryScale,
  ])

  const applyLayout = useCallback((mode, animate) => {
    const track = trackRef.current
    if (!track) return

    const cards = cardsRef.current.filter(Boolean)
    if (!cards.length) return

    let {width, height} = trackSizeRef.current
    if (!width || !height) {
      const rect = track.getBoundingClientRect()
      width = rect.width
      height = rect.height
      trackSizeRef.current = {width, height}
    }
    const viewportWidth = window.innerWidth
    const isMobile = viewportWidth < MOBILE_BREAKPOINT
    const isTablet = viewportWidth >= MOBILE_BREAKPOINT && viewportWidth <= TABLET_BREAKPOINT
    const ringScaleFactor = getResponsiveRingScale(viewportWidth)
    const responsiveTransforms = {
      ...transforms,
      flat: {
        ...transforms.flat,
        radiusX: isMobile
          ? transforms.flat.radiusX * MOBILE_FLAT_RADIUS_X_SCALE
          : transforms.flat.radiusX,
      },
      tilt: {
        ...transforms.tilt,
        radiusX: isMobile
          ? transforms.tilt.radiusX * MOBILE_TILT_RADIUS_X_SCALE
          : transforms.tilt.radiusX,
        radiusY: isMobile
          ? transforms.tilt.radiusY * MOBILE_TILT_RADIUS_Y_SCALE
          : transforms.tilt.radiusY,
      },
      ring: {
        ...transforms.ring,
        radiusX: transforms.ring.radiusX * (isTablet ? 0.94 : 1),
        radiusY: transforms.ring.radiusY * (isTablet ? 0.94 : 1),
        scale: transforms.ring.scale * ringScaleFactor,
      },
      gallery: {
        ...transforms.gallery,
        scale: transforms.gallery.scale * (isMobile ? MOBILE_GALLERY_SCALE : 1),
      },
    }

    const layout = buildLayout(
      mode,
      cards.length,
      width,
      height,
      sizes,
      responsiveTransforms,
      imageGap,
      rotationOffsetRef.current,
    )

    const commit = () => {
      cards.forEach((card, i) => {
        const box = layout[i]
        gsap.set(card, {
          x: box.x,
          y: box.y,
          xPercent: -50,
          yPercent: -50,
          width: box.width,
          height: box.height,
          zIndex: box.zIndex,
        })
      })
    }

    if (!animate || reducedMotion) {
      commit()
      return
    }

    const state = Flip.getState(cards)
    commit()
    isFlipAnimatingRef.current = true

    if (flipResumeTimeoutRef.current !== null) {
      window.clearTimeout(flipResumeTimeoutRef.current)
    }

    flipResumeTimeoutRef.current = window.setTimeout(() => {
      isFlipAnimatingRef.current = false
      flipResumeTimeoutRef.current = null
    }, FLIP_DURATION_SECONDS * 1000)

    Flip.from(state, {
      duration: FLIP_DURATION_SECONDS,
      ease: 'power3.inOut',
      stagger: 0.015,
      absolute: true,
    })
  }, [sizes, transforms, imageGap, reducedMotion])

  useEffect(() => {
    modeRef.current = initialMode
    setActiveMode(initialMode)
    applyLayout(initialMode, false)
  }, [initialMode, applyLayout])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const handleResize = () => {
      const rect = track.getBoundingClientRect()
      trackSizeRef.current = {width: rect.width, height: rect.height}
      applyLayout(modeRef.current, false)
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        trackSizeRef.current = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        }
      }
      applyLayout(modeRef.current, false)
    })
    observer.observe(track)
    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, [items.length, applyLayout])

  useEffect(() => () => {
    if (flipResumeTimeoutRef.current !== null) {
      window.clearTimeout(flipResumeTimeoutRef.current)
    }
  }, [])

  const handleModeChange = (mode) => {
    if (mode === modeRef.current) return
    modeRef.current = mode
    setActiveMode(mode)
    applyLayout(mode, true)
  }

  useEffect(() => {
    if (!rotate || reducedMotion) return undefined

    let rafId
    let lastTime = performance.now()

    const tick = (now) => {
      const dt = (now - lastTime) / 1000
      lastTime = now
      const paused = (
        isFlipAnimatingRef.current
        || (stopRotationOnHover && hoveredCardCountRef.current > 0)
      )

      if (!paused && document.visibilityState === 'visible') {
        rotationOffsetRef.current += rotateSpeed * dt
        applyLayout(modeRef.current, false)
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [rotate, rotateSpeed, stopRotationOnHover, reducedMotion, applyLayout])

  const handleCardEnter = useCallback((event, item) => {
    hoveredCardCountRef.current += 1
    setHoveredItem(item)

    const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches ?? false
    if (reducedMotion || !enableHoverMovement || !canHover || window.innerWidth < MOBILE_BREAKPOINT) return

    const inner = event.currentTarget.querySelector('.orbit-flip-slider-card-inner')
    if (!inner) return

    const rotateY = perspectiveRotateDirection === 'left'
      ? -Math.abs(perspectiveRotateValue)
      : Math.abs(perspectiveRotateValue)

    gsap.killTweensOf(inner)
    gsap.to(inner, {
      y: hoverMoveY,
      rotateY,
      boxShadow: '0 14px 26px rgba(0,0,0,0.2)',
      duration: 0.8,
      ease: 'back.out(2.2)',
    })
  }, [
    reducedMotion,
    enableHoverMovement,
    hoverMoveY,
    perspectiveRotateDirection,
    perspectiveRotateValue,
  ])

  const handleCardLeave = useCallback((event) => {
    hoveredCardCountRef.current = Math.max(0, hoveredCardCountRef.current - 1)
    setHoveredItem(null)

    if (reducedMotion || !enableHoverMovement || window.innerWidth < MOBILE_BREAKPOINT) return

    const inner = event.currentTarget.querySelector('.orbit-flip-slider-card-inner')
    if (!inner) return

    gsap.killTweensOf(inner)
    gsap.to(inner, {
      y: 0,
      rotateY: 0,
      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      duration: 0.7,
      ease: 'back.out(2.2)',
    })
  }, [reducedMotion, enableHoverMovement])

  return (
    <div className="orbit-flip-slider" style={{backgroundColor}}>
      <div ref={trackRef} className="orbit-flip-slider__track">
        {items.map((item, i) => (
          <button
            key={item.id ?? i}
            ref={(node) => {
              cardsRef.current[i] = node
            }}
            type="button"
            className="orbit-flip-slider-card"
            onMouseEnter={(event) => handleCardEnter(event, item)}
            onMouseLeave={handleCardLeave}
            onFocus={() => setHoveredItem(item)}
            onBlur={() => setHoveredItem(null)}
            onClick={() => onItemOpen?.(item, i)}
            data-cursor="View"
            aria-label={`Open ${item.title ?? item.alt ?? `selected work ${i + 1}`}`}
          >
            <span className="orbit-flip-slider-card-inner">
              <img
                src={item.image}
                alt={item.alt ?? item.title ?? `Selected work ${i + 1}`}
                draggable={false}
                loading="eager"
                decoding="async"
              />
            </span>
          </button>
        ))}
      </div>

      <div
        className={`orbit-flip-slider__info ${hoveredItem ? 'is-visible' : ''}`}
        aria-live="polite"
        aria-hidden={!hoveredItem}
      >
        <h3>{hoveredItem?.title ?? ''}</h3>
      </div>

      {showModeControls ? (
        <div className="orbit-flip-slider__modes" aria-label="Carousel layout">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              onClick={() => handleModeChange(mode.key)}
              className={activeMode === mode.key ? 'is-active' : ''}
            >
              {mode.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
