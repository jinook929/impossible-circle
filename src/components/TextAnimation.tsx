import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TextAnimation = () => {
  const [text, setText] = useState("Impossible");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setText(prev => prev === "Impossible" ? "(I'm possible)" : "Impossible");
    }, 4000); // Switch text every 4 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      style={{
        color: '#fff',
        fontSize: '2.5rem',
        fontFamily: 'monospace',
        letterSpacing: '0.1em',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          style={{ display: 'flex', whiteSpace: 'pre' }}
        >
          {text.split("").map((char, index) => (
            <motion.span
              key={`char-${index}`}
              style={{ display: 'inline-block' }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 0,
                transition: {
                  delay: (text.length - 1 - index) * 0.05 // Reverse delay for exit
                }
              }}
              transition={{
                duration: 0.15,
                delay: index * 0.05, // Forward delay for entrance
                ease: "easeOut"
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default TextAnimation;
