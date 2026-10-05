import {useEffect, useRef, useState} from 'react'
import {motion, useMotionValue, useSpring} from 'motion/react'

export default function CustomCursor() {
  const [label, setLabel] = useState('')
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, {stiffness: 700, damping: 45, mass: 0.3})
  const sy = useSpring(y, {stiffness: 700, damping: 45, mass: 0.3})
  const rafRef = useRef()

  useEffect(() => {
    const move = (event) => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        x.set(event.clientX)
        y.set(event.clientY)
      })
    }

    const over = (event) => {
      const interactive = event.target.closest('[data-cursor]')
      setLabel(interactive?.dataset.cursor || '')
    }

    window.addEventListener('pointermove', move)
    document.addEventListener('pointerover', over)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
    }
  }, [x, y])

  return (
    <motion.div
      className={`cursor ${label ? 'cursor--active' : ''}`}
      style={{left: sx, top: sy}}
      aria-hidden="true"
    >
      <span>{label}</span>
    </motion.div>
  )
}
