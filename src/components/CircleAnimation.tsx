import type { RefObject } from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { random } from "lodash";

const RINGS = 12;
const DOTS = 100;
const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const ORBIT_DURATION = 12;
const CENTER = { x: SVG_WIDTH / 2, y: SVG_HEIGHT / 2 };

interface CircleAnimationProps {
  containerRef: RefObject<HTMLDivElement>;
  phase: string;
  onPhaseChange?: (newPhase: string) => void;
}

// Helper to get a color from a hue value
function getColorFromHue(hue: number, sat = 80, light = 60) {
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

const CircleAnimation = ({
  containerRef,
  phase,
  onPhaseChange
}: CircleAnimationProps) => {
  const controls = useAnimation();
  const [currentRing, setCurrentRing] = useState(RINGS + 1);
  const [dotOpacity, setDotOpacity] = useState(1);
  const [hueBase, setHueBase] = useState(0);
  const [dots, setDots] = useState<Array<{x: number; y: number; delay: number; size: number}>>([]);

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
    if (phase === "reset") return; // Skip animation during reset
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
          x: 12,
          y: 12,
          transition: {
            duration: 0.5,
            ease: "easeInOut"
          }
        });

        onPhaseChange?.("suck");
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
        
        setTimeout(() => {
          onPhaseChange?.("scatter");
        }, 200);
      }
      
      if (phase === "scatter") {
        const newDots = Array.from({ length: DOTS }).map(() => {
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
  }, [phase, controls, onPhaseChange]);

  return (
    <div ref={containerRef} style={{
      width: SVG_WIDTH,
      height: SVG_HEIGHT,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
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
              transformStyle: "preserve-3d",
              inset: 0
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
              width: '24px',
              height: '24px',
              background: `radial-gradient(circle at 60% 40%, ${getColorFromHue(hueBase, 100, 70)}, ${getColorFromHue((hueBase + 60) % 360, 100, 40)})`,
              boxShadow: `0 0 24px 8px ${getColorFromHue(hueBase, 100, 60)}`,
              borderRadius: '50%',
              transformOrigin: 'center center',
              opacity: dotOpacity,
              translate: '-50% -50%'
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
          <div key="scatter-container" style={{ position: 'absolute', inset: 0 }}>
            {dots.map((dot, index) => {
              const dotHue = (hueBase + index * (360 / dots.length)) % 360;
              return (
                <motion.div
                  key={`dot-${index}`}
                  style={{
                    position: 'absolute',
                    width: `${dot.size}px`,
                    height: `${dot.size}px`,
                    background: `radial-gradient(circle at 60% 40%, ${getColorFromHue(dotHue, 100, 70)}, ${getColorFromHue((dotHue + 60) % 360, 100, 40)})`,
                    boxShadow: `0 0 12px 2px ${getColorFromHue(dotHue, 100, 60)}`,
                    borderRadius: '50%',
                    left: '50%',
                    top: '50%',
                    translate: '-50% -50%'
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
                    opacity: [0.3, 1, 0.7, 1],
                    scale: [0.25, 7.5, 2.5, 1],
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
  );
};

export default CircleAnimation;
