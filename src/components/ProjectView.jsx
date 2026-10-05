import {useState} from 'react'
import {AnimatePresence, motion} from 'motion/react'
import BlurLineReveal from './BlurLineReveal'
import ImageLightbox from './ImageLightbox'
import ParallaxImage from './ParallaxImage'

const chunkText = (text = '', wordsPerLine = 6) => {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines = []

  for (let index = 0; index < words.length; index += wordsPerLine) {
    lines.push(words.slice(index, index + wordsPerLine).join(' '))
  }

  return lines.length ? lines : ['Untitled project.']
}

export default function ProjectView({project, onClose, backLabel = 'Back'}) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const briefLines = chunkText(project.description || project.brief || '', 6)

  return (
    <motion.main
      className="project-view"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.45}}
    >
      <div className="project-view__topbar">
        <span>Selected work / {project.number}</span>
        {onClose && (
          <button type="button" onClick={onClose} data-cursor="Back" className="text-button">
            {backLabel}
          </button>
        )}
      </div>

      <section className="project-editorial-grid">
        <aside className="project-editorial-grid__rail project-editorial-grid__rail--left">
          <BlurLineReveal
            className="project-editorial-grid__title"
            lines={[project.title]}
            amount={0.2}
          />

          <div className="project-editorial-grid__facts">
            {project.year ? <div><span>Year</span><strong>{project.year}</strong></div> : null}
            {project.medium ? <div><span>Medium</span><strong>{project.medium}</strong></div> : null}
            {project.dimensions ? <div><span>Dimensions</span><strong>{project.dimensions}</strong></div> : null}
          </div>
        </aside>

        <div className="project-editorial-grid__center">
          <div className="project-editorial-grid__intro">
            <BlurLineReveal
              className="project-editorial-grid__brief"
              lines={briefLines}
              amount={0.25}
            />
            <div className="project-editorial-grid__intro-meta">
              <span>Project / {project.number}</span>
              <span>{project.medium || 'Painting'}</span>
            </div>
          </div>

          <div className="project-editorial-grid__gallery project-editorial-grid__gallery--single">
            <motion.figure
              className="project-editorial-grid__media project-editorial-grid__media--single project-editorial-grid__media--clickable"
              initial={{clipPath: 'inset(7% 0 7% 0)', opacity: 0.35}}
              whileInView={{clipPath: 'inset(0% 0 0% 0)', opacity: 1}}
              viewport={{once: false, amount: 0.12}}
              transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
              onClick={() => setPreviewOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setPreviewOpen(true)
                }
              }}
              role="button"
              tabIndex={0}
              data-cursor="Open"
              aria-label={`Open full-size preview of ${project.title}`}
            >
              <ParallaxImage
                src={project.image}
                alt={project.title}
                strength={20}
                className="project-editorial-grid__parallax"
                layoutId={`project-image-${project.slug}`}
              />
            </motion.figure>
          </div>
        </div>

        <aside className="project-editorial-grid__rail project-editorial-grid__rail--right">
          <div className="project-editorial-grid__note">
            <span>Work</span>
            <p>{project.description || 'Selected painting.'}</p>
          </div>
          {project.medium ? (
            <div className="project-editorial-grid__note">
              <span>Medium</span>
              <p>{project.medium}{project.dimensions ? ` · ${project.dimensions}` : ''}</p>
            </div>
          ) : null}
          <div className="project-editorial-grid__index">
            <span>{project.medium || 'Painting'}</span>
            <strong>{project.number}</strong>
          </div>
        </aside>
      </section>

      <div className="project-view__end">
        <div className="marquee">
          <div className="marquee__track">
            <span>Back to the works — explore the archive — </span>
            <span>Back to the works — explore the archive — </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {previewOpen ? (
          <ImageLightbox
            src={project.image}
            alt={project.title}
            onClose={() => setPreviewOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </motion.main>
  )
}
