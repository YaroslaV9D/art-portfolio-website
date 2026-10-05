import {AnimatePresence} from 'motion/react'
import {useEffect, useMemo} from 'react'
import {Link, Route, Routes, useLocation, useNavigate, useParams} from 'react-router-dom'
import CustomCursor from './components/CustomCursor'
import ProjectView from './components/ProjectView'
import SmoothScroll from './components/SmoothScroll'
import OrbitFlipSlider from './components/OrbitFlipSlider'
import BlurLineReveal from './components/BlurLineReveal'
import useProjects from './hooks/useProjects'

function Header() {
  return (
    <header className="site-header">
      <Link to="/" className="brand" data-cursor="Home">
        HIGH CULTURE
      </Link>
      <nav>
        <a href="#works" data-cursor="Go">Works</a>
        <a href="#about" data-cursor="Go">About</a>
        <a href="mailto:hello@example.com" data-cursor="Mail">Contact</a>
      </nav>
      <div className="site-header__right">
        <span>Personal portfolio</span>
        <span className="status-dot">Selected works</span>
      </div>
    </header>
  )
}

function ProjectsState({loading, error, count}) {
  if (loading) {
    return <div className="projects-state">Loading works…</div>
  }

  if (error) {
    return (
      <div className="projects-state projects-state--error">
        <strong>Projects could not load.</strong>
        <span>{error.message}</span>
      </div>
    )
  }

  if (count === 0) {
    return <div className="projects-state">No published projects yet.</div>
  }

  return null
}

function Home() {
  const navigate = useNavigate()
  const {projects, loading, error} = useProjects()
  const orbitItems = useMemo(() => projects.map((project) => ({
    id: project.id,
    title: project.title,
    alt: `${project.title} — selected project`,
    image: project.image,
    href: `/works/${project.slug}`,
    slug: project.slug,
  })), [projects])

  return (
    <main>
      <section className="hero">
        <div className="hero__kicker">(personal art portfolio)</div>
        <BlurLineReveal
          className="hero__headline hero__headline--art blur-reveal--hero"
          lines={['HIGH CULTURE', 'CAUGHT IN', 'MOTION']}
          amount={0.15}
        />
        <div className="hero__foot">
          <p className="hero__brand-statement">Painting the visual language of our time in motion.</p>
          <span>Scroll to explore ↓</span>
        </div>
      </section>

      <section className="works works--orbit" id="works">
        <div className="orbit-flip-shell">
          <ProjectsState loading={loading} error={error} count={projects.length} />
          {!loading && !error && orbitItems.length > 0 ? (
            <OrbitFlipSlider
              items={orbitItems}
              initialMode="ring"
              showModeControls={false}
              backgroundColor="transparent"
              imageWidth={96}
              imageHeight={150}
              imageGap={0}
              enableHoverMovement
              hoverMoveY={-8}
              perspectiveRotateValue={180}
              perspectiveRotateDirection="right"
              rotate
              rotateSpeed={4}
              stopRotationOnHover
              ringRotateX={31}
              ringRotateY={56}
              ringRotateZ={-25}
              ringRadiusX={1.5}
              ringRadiusY={1.2}
              ringScale={1}
              onItemOpen={(item) => navigate(item.href)}
            />
          ) : null}
        </div>

        <div className="orbit-flip-help">
          <span>{projects.length ? `${projects.length} works` : 'Portfolio'}</span>
          <span>Hover to flip · click to open</span>
        </div>
      </section>

      <section className="about" id="about">
        <div className="section-label">
          <span>(artist statement)</span>
          <span>2026</span>
        </div>

        <div className="artist-statement">
          <BlurLineReveal
            className="artist-statement__lead"
            lines={[
              'A visual study of contemporary culture',
              'through realism and movement.',
            ]}
            amount={0.2}
          />

          <BlurLineReveal
            className="artist-statement__short"
            lines={[
              'Fashion, desire, status and spectacle translated into paintings',
              'that feel alive, unstable and cinematic.',
            ]}
            amount={0.25}
          />

          <div className="artist-statement__body">
            <BlurLineReveal
              className="artist-statement__paragraph"
              lines={[
                'My work reflects the visual culture of the present: fashion imagery,',
                'luxury objects, nightlife, celebrity aesthetics, social rituals,',
                'desire and status.',
              ]}
              amount={0.25}
            />

            <BlurLineReveal
              className="artist-statement__paragraph"
              lines={[
                'I use realism as a base, then disrupt it through motion blur,',
                'shallow focus, saturated colour and complex composition.',
                'The result is an image that feels familiar but unstable — like a memory,',
                'a campaign, a party, a film still and a painting collapsing into one another.',
              ]}
              amount={0.2}
            />

            <BlurLineReveal
              className="artist-statement__paragraph"
              lines={[
                'The paintings are not intended as illustrations of a single message.',
                'They are observations of how contemporary culture looks,',
                'moves and seduces us.',
              ]}
              amount={0.25}
            />
          </div>
        </div>
      </section>

      <footer>
        <span>© 2026 Personal Art Portfolio</span>
        <span>Painting the visual language of our time in motion.</span>
      </footer>
    </main>
  )
}

function FullProjectPage() {
  const {slug} = useParams()
  const navigate = useNavigate()
  const {projects, loading, error} = useProjects()

  useEffect(() => {
    window.scrollTo({top: 0, left: 0, behavior: 'auto'})
  }, [slug])

  if (loading) return <div className="not-found">Loading project…</div>
  if (error) return <div className="not-found">{error.message}</div>

  const project = projects.find((item) => item.slug === slug)
  if (!project) return <div className="not-found">Project not found or not published.</div>

  return <ProjectView project={project} onClose={() => navigate(-1)} />
}

export default function App() {
  const location = useLocation()
  const isProject = location.pathname.startsWith('/works/')

  return (
    <>
      <SmoothScroll />
      <CustomCursor />
      {!isProject && <Header />}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/works/:slug" element={<FullProjectPage />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
