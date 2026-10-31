import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
    if (user) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (introSeen()) {
      navigate('/login', { replace: true });
      return;
    }
    if (reduce) {
      markIntroSeen();
      navigate('/login', { replace: true });
      return;
    }
    const timers = [];
    timers.push(setTimeout(() => setStage(1), 900));
    timers.push(setTimeout(() => setStage(2), 2000));
    timers.push(setTimeout(() => setStage(3), 3200));
    timers.push(setTimeout(() => setStage(4), 4600));
    timers.push(setTimeout(() => { markIntroSeen(); navigate('/login', { replace: true }); }, 5800));
    return () => timers.forEach(clearTimeout);
  }, [user, introSeen, markIntroSeen, reduce, navigate]);

  const skip = () => {
    markIntroSeen();
    navigate('/login', { replace: true });
  };

  return (
    <div className="intro-root">
      <div className="intro-bg" />
      <div className="intro-particles" />
      <div className="intro-streaks" />
      <div className="intro-content">
        <motion.div
          className="intro-tech"
          initial={{ opacity: 0, y: 20, filter: 'blur(12px)' }}
          animate={stage >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          TECH
        </motion.div>
        <motion.div
          className="intro-blitz"
          initial={{ opacity: 0, y: 24, filter: 'blur(14px)' }}
          animate={stage >= 3 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          BLITZ
        </motion.div>
        <motion.div
          className="intro-tagline"
          initial={{ opacity: 0 }}
          animate={stage >= 4 ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          Preserve Knowledge. Accelerate Intelligence.
        </motion.div>
      </div>
      <button className="skip-intro" onClick={skip}>Skip Intro</button>
    </div>
  );
}