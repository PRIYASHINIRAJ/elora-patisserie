import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [variant, setVariant] = useState('default'); // default | view | explore | button
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);

      const target = e.target.closest('[data-cursor]');
      setVariant(target?.dataset.cursor || 'default');
    };
    const leave = () => setVisible(false);

    window.addEventListener('mousemove', move);
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, [isDesktop, x, y]);

  if (!isDesktop) return null;

  const sizes = { default: 14, view: 64, explore: 72, button: 22 };
  const size = sizes[variant] || sizes.default;

  return (
    <motion.div
      style={{ x: springX, y: springY, translateX: '-50%', translateY: '-50%' }}
      className="fixed top-0 left-0 z-[100] pointer-events-none mix-blend-difference"
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ opacity: { duration: 0.15 } }}
    >
      <motion.div
        animate={{ width: size, height: size }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="rounded-full bg-champagne flex items-center justify-center"
      >
        {(variant === 'view' || variant === 'explore') && (
          <span className="text-espresso text-[10px] tracking-wide-cap uppercase font-body">
            {variant === 'view' ? 'View' : 'Explore'}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
