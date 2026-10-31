import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReducedMotion } from 'framer-motion';
import './Intro.css';

export default function Intro() {
  const navigate = useNavigate();
  const { user, introSeen, markIntroSeen } = useAuth();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (user) { navigate('/dashboard', { replace: true }); return; }
    if (introSeen()) { navigate('/login', { replace: true }); return; }
    if (reduce) { markIntroSeen(); navigate('/login', { replace: true }); return; }

    const t = [];
    t.push(setTimeout(() => setStage(1), 600));   // TECH
    t.push(setTimeout(() => setStage(2), 1500));  // BLITZ
    t.push(setTimeout(() => setStage(3), 2600));  // DUST
    t.push(setTimeout(() => setStage(4), 3600));  // LOGO
    t.push(setTimeout(() => setStage(5), 5000));  // SPLIT
    t.push(setTimeout(() => { markIntroSeen(); navigate('/login', { replace: true }); }, 6400));
    return () => t.forEach(clearTimeout);
  }, [user, introSeen, markIntroSeen, reduce, navigate]);

  const skip = () => { markIntroSeen(); navigate('/login', { replace: true }); };

  return (
    <div className="intro-root">
      <div className="intro-bg" />
      <div className="intro-particles" />

      <div className="intro-center">
        {stage >= 1 && (
          <motion.div className="intro-tech" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
            TECH
          </motion.div>
        )}
        {stage >= 2 && (
          <motion.div className="intro-blitz" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }}>
            BLITZ
          </motion.div>
        )}
      </div>

      {stage >= 3 && <div className="dust-burst" />}

      {stage >= 4 && (
        <motion.div className="logo-reveal" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
          <img src="/src/assets/tech-blitz-logo.png" alt="TECH BLITZ" className="logo-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </motion.div>
      )}

      {stage >= 5 && (
        <div className="logo-split">
          <motion.div className="logo-half left" initial={{ x: 0 }} animate={{ x: -120, rotate: -6 }} transition={{ duration: 0.9, ease: 'easeInOut' }}>
            <img src="/src/assets/tech-blitz-logo.png" alt="" className="logo-img clip-left" />
          </motion.div>
          <motion.div className="logo-half right" initial={{ x: 0 }} animate={{ x: 120, rotate: 6 }} transition={{ duration: 0.9, ease: 'easeInOut' }}>
            <img src="/src/assets/tech-blitz-logo.png" alt="" className="logo-img clip-right" />
          </motion.div>
        </div>
      )}

      <button className="skip-intro" onClick={skip}>Skip Intro</button>
    </div>
  );
}