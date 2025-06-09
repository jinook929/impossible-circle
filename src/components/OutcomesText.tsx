import { motion } from "framer-motion";

const OutcomesText = () => {
  return (
    <motion.div
      style={{
        fontSize: '2.5rem',
        fontFamily: 'monospace',
        letterSpacing: '0.1em',
        pointerEvents: 'none',
        background: 'linear-gradient(to right, #fff, #7ab5ff, #fff)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent'
      }}
      animate={{
        backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      Outcomes
    </motion.div>
  );
};

export default OutcomesText;
