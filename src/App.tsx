import { useEffect, useState, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { random } from "lodash";

// Helper to get a color from a hue value
function getColorFromHue(hue: number, sat = 80, light = 60) {
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

const RINGS = 12;
const DOTS = 100;
const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const CENTER = { x: SVG_WIDTH / 2, y: SVG_HEIGHT / 2 };
const ORBIT_DURATION = 12;

interface Dot {
  x: number;
  y: number;
  delay: number;
  size: number;
}

const TextAnimation = () => {
  const [text, setText] = useState("Impossible");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setText(prev => prev === "Impossible" ? "I'm possible" : "Impossible");
    }, 4000); // Switch text every 4 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
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

function App() {
  const [phase, setPhase] = useState("orbit");
  const controls = useAnimation();
  const [dots, setDots] = useState<Dot[]>([]);
  const [currentRing, setCurrentRing] = useState(RINGS + 1);
  const [dotOpacity, setDotOpacity] = useState(1);
  const [hueBase, setHueBase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRestart = () => {
    if (phase === "scatter") {
      setPhase("orbit");
      setCurrentRing(RINGS + 1);
      setDotOpacity(1);
      setDots([]);
    }
  };

  // Animate hue for color cycling
  useEffect(() => {
    if (phase === "orbit" || phase === "scatter") {
      let frame: number;
      const animateHue = () => {
        setHueBase(h => (h + 1) % 360);
        frame = requestAnimationFrame(animateHue);
      };
      frame = requestAnimationFrame(animateHue);
      return () => cancelAnimationFrame(frame);
    }
  }, [phase]);

  useEffect(() => {
    const animate = async () => {
      if (phase === "orbit") {
        for (let i = RINGS - 1; i >= 0; i--) {
          setCurrentRing(RINGS - i);
          const rx = (i + 1) * 25;
          const ry = (i + 1) * 12;
          
          const steps = 60;
          const xKeyframes: number[] = [];
          const yKeyframes: number[] = [];
          
          for (let step = 0; step <= steps; step++) {
            const angle = (step / steps) * Math.PI * 2;
            xKeyframes.push(Math.cos(angle) * rx);
            yKeyframes.push(Math.sin(angle) * ry);
          }

          // Start fading out when we reach the last 7 rings, but maintain minimum opacity of 0.3
          if (i <= 7) {
            setDotOpacity(0.3 + ((i / 7) * 0.7));  // Will reach 0.3 at minimum
          }
          
          await controls.start({
            x: xKeyframes,
            y: yKeyframes,
            transition: {
              duration: ORBIT_DURATION / RINGS,
              ease: "linear",
              times: Array.from({ length: steps + 1 }, (_, i) => i / steps)
            }
          });
        }

        // Move to center with animation
        await controls.start({
          x: -13,
          y: -13,
          transition: {
            duration: 0.8,
            ease: "easeInOut"
          }
        });

        setPhase("suck");
      }
      
      if (phase === "suck") {
        await Promise.all([
          controls.start({
            x: 0,
            y: 0,
            scale: 0,
            transition: { 
              duration: 2,
              ease: [0.4, 0, 0.2, 1],
              x: { duration: 2 },
              y: { duration: 2 },
              scale: {
                duration: 1.5,
                delay: 0.5
              }
            }
          })
        ]);
        setTimeout(() => setPhase("scatter"), 200);
      }
      
      if (phase === "scatter") {
        const newDots: Dot[] = Array.from({ length: DOTS }).map(() => {
          const angle = random(0, Math.PI * 2);
          const distance = random(50, 300);
          return {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            delay: random(0, 0.5), // Reduced delay for quicker initial scatter
            size: random(1, 3)
          };
        });
        setDots(newDots);
      }
    };
    
    animate();
  }, [phase, controls]);

  return (
    <div 
      style={{ 
        width: '100%',
        height: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: phase === 'scatter' ? 'pointer' : 'default'
      }}
      onClick={handleRestart}
    >
      <TextAnimation />
      <div ref={containerRef} style={{
        width: SVG_WIDTH,
        height: SVG_HEIGHT,
        position: 'relative'
      }}>
        <AnimatePresence>
          {phase !== "scatter" && (
            <motion.svg 
              key="ellipse-container"
              width={SVG_WIDTH} 
              height={SVG_HEIGHT} 
              style={{ 
                position: 'absolute',
                perspective: "1000px",
                transformStyle: "preserve-3d"
              }}
              initial={{ rotateX: 0, rotateY: 0 }}
              animate={phase === "suck" ? {
                rotateX: 360,
                rotateY: 360,
                transition: { duration: 2, ease: "easeInOut" }
              } : {}}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {[...Array(RINGS)].map((_, i) => {
                const isCurrentRing = i === currentRing;
                const radius = RINGS - i;
                // Color cycling: each ring gets a different hue
                const ringHue = (hueBase + i * (360 / RINGS)) % 360;
                return (
                  <motion.ellipse
                    key={`ellipse-${i}`}
                    cx={CENTER.x}
                    cy={CENTER.y}
                    rx={radius * 25}
                    ry={radius * 12}
                    stroke={getColorFromHue(ringHue, 80, isCurrentRing ? 70 : 40)}
                    filter={isCurrentRing ? 'drop-shadow(0 0 8px ' + getColorFromHue(ringHue, 80, 70) + ')' : 'none'}
                    fill="none"
                    strokeWidth={!isCurrentRing ? "2" : "1"}
                    initial={{ opacity: 1 }}
                    style={{ transformOrigin: 'center' }}
                    animate={phase === "suck" ? {
                      rx: 0,
                      ry: 0,
                      opacity: 0,
                      rotate: 720,
                      transition: { 
                        duration: 2,
                        ease: [0.4, 0, 0.2, 1],
                        rotate: { duration: 2, ease: "easeInOut" }
                      }
                    } : { opacity: 1 }}
                  />
                );
              })}
            </motion.svg>
          )}

          {phase !== "scatter" && (
            <motion.div
              key="orbit-dot"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '24px',
                height: '24px',
                background: `radial-gradient(circle at 60% 40%, ${getColorFromHue(hueBase, 100, 70)}, ${getColorFromHue((hueBase + 60) % 360, 100, 40)})`,
                boxShadow: `0 0 24px 8px ${getColorFromHue(hueBase, 100, 60)}`,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                transformOrigin: 'center center',
                opacity: dotOpacity
              }}
              initial={{ x: 0, y: 0 }}
              animate={controls}
              transition={{
                opacity: {
                  duration: ORBIT_DURATION / RINGS
                }
              }}
              exit={{ scale: 0 }}
            />
          )}

          {phase === "scatter" && (
            <div key="scatter-container">
              {dots.map((dot, index) => {
                // Each dot gets a unique hue for more colorfulness
                const dotHue = (hueBase + index * (360 / DOTS)) % 360;
                return (
                  <motion.div
                    key={`dot-${index}`}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: `${dot.size}px`,
                      height: `${dot.size}px`,
                      background: `radial-gradient(circle at 60% 40%, ${getColorFromHue(dotHue, 100, 70)}, ${getColorFromHue((dotHue + 60) % 360, 100, 40)})`,
                      boxShadow: `0 0 12px 2px ${getColorFromHue(dotHue, 100, 60)}`,
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    initial={{ 
                      x: 0,
                      y: 0,
                      opacity: 0,
                      scale: 0
                    }}
                    animate={{ 
                      x: dot.x, 
                      y: dot.y,
                      opacity: [0, 1, 0.3, 1], // Blinking effect
                      scale: [0, 1, 1.2, 1], // Pulsing effect
                    }}
                    transition={{ 
                      duration: 3,
                      delay: dot.delay,
                      repeat: Infinity,
                      repeatType: "reverse",
                      times: [0, 0.2, 0.6, 1],
                      opacity: {
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      },
                      scale: {
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App
