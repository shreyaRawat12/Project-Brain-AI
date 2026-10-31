import { BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BrainVisual({ reduce }) {
  return (
    <div className="assistant-brain-orbit" aria-hidden="true">
      <motion.div
        className="assistant-orbit-ring ring-1"
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="assistant-orbit-ring ring-2"
        animate={reduce ? {} : { rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="assistant-orbit-ring ring-3"
        animate={reduce ? {} : { rotate: 360 }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="assistant-brain-glow"
        animate={reduce ? {} : { scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {!reduce && (
        <div className="assistant-particle-layer">
          {[0, 90, 180, 270].map((angle) => (
            <span
              key={angle}
              className="assistant-particle"
              style={{ transform: `rotate(${angle}deg) translateX(72px)` }}
            />
          ))}
        </div>
      )}
      <motion.div
        className="assistant-brain-icon"
        animate={reduce ? {} : { scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BrainCircuit size={40} />
      </motion.div>
    </div>
  );
}
