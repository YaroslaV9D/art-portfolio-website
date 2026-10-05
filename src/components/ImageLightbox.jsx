import {useEffect, useRef} from 'react'
import {motion} from 'motion/react'

export default function ImageLightbox({src, alt = '', onClose}) {
  const closeRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <motion.div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Artwork preview"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.28}}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="image-lightbox__bar">
        <span>Full image preview</span>
        <button
          ref={closeRef}
          type="button"
          className="text-button image-lightbox__close"
          onClick={onClose}
          data-cursor="Close"
        >
          Close
        </button>
      </div>

      <motion.img
        className="image-lightbox__image"
        src={src}
        alt={alt}
        initial={{scale: 0.985, opacity: 0}}
        animate={{scale: 1, opacity: 1}}
        exit={{scale: 0.985, opacity: 0}}
        transition={{duration: 0.38, ease: [0.16, 1, 0.3, 1]}}
        draggable="false"
      />
    </motion.div>
  )
}
