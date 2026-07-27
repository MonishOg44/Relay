import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

export default function IntroAnimation({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [deviceType, setDeviceType] = useState('Desktop');
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';
  const isLight = theme === 'light';

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const width = window.innerWidth;

    const isTablet =
      /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(userAgent) ||
      (width >= 600 && width <= 1024 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

    if (isTablet) {
      setDeviceType('Tablet');
    } else {
      const isMobile =
        /(mobi|ipod|iphone|android|blackberry|opera mini|windows phone)/i.test(userAgent) ||
        (width < 600 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

      if (isMobile) {
        setDeviceType('Mobile');
      } else {
        setDeviceType('Desktop');
      }
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 1700);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="intro-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            background: isLight ? '#ffffff' : '#000000',
            zIndex: 9999,
            height: '100dvh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Dead-centered clean Relay logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="relay-brand-script"
              style={{
                fontSize: '84px',
                color: isLight ? '#000000' : '#ffffff',
                lineHeight: 1,
                paddingRight: '12px'
              }}
            >
              Relay
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
