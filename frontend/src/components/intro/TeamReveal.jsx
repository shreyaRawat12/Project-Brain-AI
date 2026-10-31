
import { motion, AnimatePresence } from 'framer-motion';
import './TeamReveal.css';

const MEMBERS = [
  {
    id: 'center',
    name: 'Shailendra',
    image: '/shailendra.png',
    position: 'center',
    initialX: 0,
  },
  {
    id: 'left',
    name: 'Rishita',
    image: '/rishita.png',
    position: 'extreme-left',
    initialX: -900,
  },
  {
    id: 'innerLeft',
    name: 'Shreya',
    image: '/shreya.png',
    position: 'inner-left',
    initialX: -500,
  },
  {
    id: 'innerRight',
    name: 'Piyush',
    image: '/piyush.png',
    position: 'inner-right',
    initialX: 500,
  },
  {
    id: 'right',
    name: 'Prashasti',
    image: '/prashasti.png',
    position: 'extreme-right',
    initialX: 900,
  },
];

export default function TeamReveal({ stage }) {
  const visibleStages = [
    'TEAM_CENTER',
    'TEAM_EXTREME_LEFT',
    'TEAM_INNER_LEFT',
    'TEAM_INNER_RIGHT',
    'TEAM_EXTREME_RIGHT',
    'MERGE',
  ];

  const currentIndex = visibleStages.indexOf(stage);
  const isMerging = stage === 'MERGE';
  const showFullTeam = stage === 'FULL_TEAM' || stage === 'FINAL_HOLD';

  return (
    <div className="team-reveal-root">
      <AnimatePresence>
        {!showFullTeam && currentIndex >= 0 && (
          <div className="team-cutouts">
            {MEMBERS.map((member, index) => {
              if (index > currentIndex && !isMerging) return null;

              return (
                <motion.div
                  key={member.id}
                  className={`member-wrapper member-${member.position}`}
                  initial={{
                    x: member.initialX,
                    opacity: 0,
                    scale: 0.75,
                  }}
                  animate={
                    isMerging
                      ? {
                          left: '50%',
                          right: 'auto',
                          x: '-50%',
                          opacity: 0,
                          scale: 0.25,
                        }
                      : {
                          x: 0,
                          opacity: 1,
                          scale: 1,
                        }
                  }
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: isMerging ? 1.2 : 0.9,
                    ease: 'easeInOut',
                  }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="cutout"
                  />
                  {!isMerging && (
                    <motion.p
                      className="member-name"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {member.name}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullTeam && (
          <motion.img
            key="full-team"
            src="/team.png"
            alt="Our Team"
            className="team-full-photo"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
