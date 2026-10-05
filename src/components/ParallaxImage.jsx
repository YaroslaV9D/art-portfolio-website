import {motion, useReducedMotion, useScroll, useTransform} from 'motion/react'
import {useRef} from 'react'

export default function ParallaxImage({
  src,
  alt = '',
  className = '',
  imageClassName = '',
  loading,
  strength = 18,
  layoutId,
}) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const {scrollYProgress} = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ['0%', '0%'] : [`-${strength}%`, `${strength}%`],
  )

  return (
    <div ref={ref} className={`parallax-media ${className}`}>
      <motion.img
        layoutId={layoutId}
        className={`parallax-media__image ${imageClassName}`}
        src={src}
        alt={alt}
        loading={loading}
        style={{y}}
        draggable="false"
      />
    </div>
  )
}
