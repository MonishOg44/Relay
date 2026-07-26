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
          }}
        >
          {/* 100% Dead-Centered Container */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Single Line: Relay Script Font + for [Device] */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <span
                className="relay-brand-script"
                style={{
                  fontSize: '56px',
                  color: isLight ? '#000000' : '#ffffff',
                  lineHeight: 1,
                }}
              >
                Relay
              </span>
              <span
                style={{
                  fontSize: '40px',
                  fontWeight: 800,
                  color: isLight ? '#000000' : '#ffffff',
                  letterSpacing: '-0.6px',
                  lineHeight: 1,
                }}
              >
                for {deviceType}
              </span>
            </div>

            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: isLight ? '#64748b' : '#94a3b8',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              from StrangeGT Technologies
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
