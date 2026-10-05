import {motion} from 'motion/react'

const lineVariants = {
  hidden: {
    filter: 'blur(10px)',
    opacity: 0,
    y: '20%',
  },
  visible: {
    filter: 'blur(0px)',
    opacity: 1,
    y: '0%',
  },
}

export default function BlurLineReveal({
  lines,
  className = '',
  lineClassName = '',
  delay = 0.2,
  stagger = 0.1,
  once = false,
  amount = 0.45,
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{once, amount}}
      transition={{delayChildren: delay, staggerChildren: stagger}}
    >
      {lines.map((line, index) => (
        <span className="blur-reveal__line-clip" key={`${line}-${index}`}>
          <motion.span
            className={`blur-reveal__line ${lineClassName}`}
            variants={lineVariants}
            transition={{duration: 0.6, ease: [0.25, 0.1, 0.25, 1]}}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.div>
  )
}
