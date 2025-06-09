import { useRef, useState } from "react";
import TextAnimation from "./components/TextAnimation";
import OutcomesText from "./components/OutcomesText";
import CircleAnimation from "./components/CircleAnimation";

function App() {
  const [phase, setPhase] = useState("orbit");
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRestart = () => {
    if (phase === "scatter") {
      setPhase("reset"); // Temporary phase to force effect re-run
      setTimeout(() => setPhase("orbit"), 10); // Move to orbit after a tick
    }
  };

  const handlePhaseChange = (newPhase: string) => {
    setPhase(newPhase);
  };

  return (
    <div 
      style={{ 
        width: '100%',
        height: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: "column",
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: phase === 'scatter' ? 'pointer' : 'default'
      }}
      onClick={handleRestart}
    >
      <TextAnimation />
      <CircleAnimation 
        containerRef={containerRef as React.RefObject<HTMLDivElement>}
        phase={phase}
        onPhaseChange={handlePhaseChange}
      />
      <OutcomesText />
    </div>
  );
}

export default App;
