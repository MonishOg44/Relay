import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ACCENT_PRESETS = [
  {
    id: 'minimal',
    name: 'Minimal Monochrome',
    color: 'var(--text-primary)', // Display color in settings
    hover: 'var(--text-primary)',
    badge: 'var(--text-primary)',
    messageOutDark: '#262626',
    messageOutLight: '#e5e5e5',
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    color: '#00a884',
    hover: '#06cf9c',
    badge: '#00a884',
    messageOutDark: '#005c4b',
    messageOutLight: '#d9fdd3',
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    color: '#06b6d4',
    hover: '#22d3ee',
    badge: '#06b6d4',
    messageOutDark: '#0e4a56',
    messageOutLight: '#cff4fc',
  },
  {
    id: 'violet',
    name: 'Neon Violet',
    color: '#a855f7',
    hover: '#c084fc',
    badge: '#a855f7',
    messageOutDark: '#4a1d6d',
    messageOutLight: '#f3e8ff',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    color: '#f43f5e',
    hover: '#fb7185',
    badge: '#f43f5e',
    messageOutDark: '#5c1d24',
    messageOutLight: '#ffe4e6',
  },
  {
    id: 'amber',
    name: 'Solar Amber',
    color: '#f59e0b',
    hover: '#fbbf24',
    badge: '#f59e0b',
    messageOutDark: '#5c3d0b',
    messageOutLight: '#fef3c7',
  },
  {
    id: 'blue',
    name: 'Cobalt Blue',
    color: '#3b82f6',
    hover: '#60a5fa',
    badge: '#3b82f6',
    messageOutDark: '#1e3a8a',
    messageOutLight: '#dbeafe',
  },
  {
    id: 'rosemilk',
    name: 'RosePetal Pink',
    color: '#ff7eb3',
    hover: '#ff9bc3',
    badge: '#ff7eb3',
    messageOutDark: '#6b203a',
    messageOutLight: '#fff0f5',
  },
];

function hexToRgba(hex, alpha) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(0, 168, 132, ${alpha})`;
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

function adjustColorForVisibility(hexColor, currentTheme) {
  let c = (hexColor || '#10b981').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  let num = parseInt(c, 16);
  if (isNaN(num)) num = 0x10b981;

  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  let adjustedColor = hexColor;

  // Safeguard 1: Pure black/dark hex in Dark mode -> contrast blue/white fallback
  if (currentTheme === 'dark' && brightness < 30) {
    adjustedColor = '#38bdf8';
  }
  // Safeguard 2: Pure white/light hex in Light mode -> contrast cobalt fallback
  else if (currentTheme === 'light' && brightness > 230) {
    adjustedColor = '#0284c7';
  }

  const contrastText = brightness > 140 ? '#0f172a' : '#ffffff';

  return { color: adjustedColor, contrastText };
}

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState(() => {
    const savedMode = localStorage.getItem('relay_theme_mode');
    if (savedMode) return savedMode;
    const legacyTheme = localStorage.getItem('relay_theme');
    if (legacyTheme) return legacyTheme;
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Listen to system color scheme changes in real-time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const theme = themeMode === 'system' ? systemTheme : themeMode;

  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem('relay_accent_color') || 'emerald';
  });

  const [customHex, setCustomHexState] = useState(() => {
    return localStorage.getItem('relay_custom_hex') || '#10b981';
  });

  const [bgStyle, setBgStyleState] = useState(() => {
    return localStorage.getItem('relay_bg_style') || 'pattern';
  });

  const [soundEffects, setSoundEffectsState] = useState(() => {
    const val = localStorage.getItem('relay_sound_effects');
    return val !== null ? val === 'true' : true;
  });

  const setSoundEffects = (enabled) => {
    setSoundEffectsState(enabled);
    localStorage.setItem('relay_sound_effects', enabled.toString());
  };

  useEffect(() => {
    localStorage.setItem('relay_theme_mode', themeMode);
    localStorage.setItem('relay_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bg-style', bgStyle);

    let activePreset;
    if (accentColor === 'custom') {
      const { color: safeHex } = adjustColorForVisibility(customHex, theme);
      activePreset = {
        id: 'custom',
        name: 'Custom Color',
        color: safeHex,
        hover: safeHex,
        badge: safeHex,
        messageOutDark: hexToRgba(safeHex, 0.35),
        messageOutLight: hexToRgba(safeHex, 0.22),
      };
    } else {
      activePreset = ACCENT_PRESETS.find((a) => a.id === accentColor) || ACCENT_PRESETS[0];
      
      if (activePreset.id === 'minimal') {
        const minimalColor = theme === 'dark' ? '#ffffff' : '#000000';
        activePreset = {
          ...activePreset,
          color: minimalColor,
          hover: theme === 'dark' ? '#e2e8f0' : '#333333',
          badge: minimalColor,
        };
      }
    }

    const { contrastText } = adjustColorForVisibility(activePreset.color, theme);

    let toggleActiveBg = activePreset.color;
    let toggleActiveKnob = contrastText;

    if (activePreset.id === 'minimal') {
      if (theme === 'dark') {
        toggleActiveBg = '#ffffff';
        toggleActiveKnob = '#000000';
      } else {
        toggleActiveBg = '#0f172a';
        toggleActiveKnob = '#ffffff';
      }
    }

    document.documentElement.style.setProperty('--accent-green', activePreset.color);
    document.documentElement.style.setProperty('--accent-green-hover', activePreset.hover);
    document.documentElement.style.setProperty('--accent-contrast-text', contrastText);
    document.documentElement.style.setProperty('--toggle-active-bg', toggleActiveBg);
    document.documentElement.style.setProperty('--toggle-active-knob', toggleActiveKnob);
    document.documentElement.style.setProperty('--icon-active', activePreset.color);
    document.documentElement.style.setProperty('--unread-badge', activePreset.badge);
    document.documentElement.style.setProperty(
      '--bg-message-out',
      theme === 'dark' ? activePreset.messageOutDark : activePreset.messageOutLight
    );
  }, [themeMode, theme, accentColor, customHex, bgStyle]);

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
    localStorage.setItem('relay_theme_mode', mode);
  };

  const setAccentColor = (colorId) => {
    setAccentColorState(colorId);
    localStorage.setItem('relay_accent_color', colorId);
  };

  const setCustomColor = (hex) => {
    setCustomHexState(hex);
    setAccentColorState('custom');
    localStorage.setItem('relay_custom_hex', hex);
    localStorage.setItem('relay_accent_color', 'custom');
  };

  const setBgStyle = (style) => {
    setBgStyleState(style);
    localStorage.setItem('relay_bg_style', style);
  };

  const setOrientationLock = (locked) => {
    setOrientationLockState(locked);
    localStorage.setItem('relay_orientation_lock', locked.toString());
  };

  const toggleTheme = () => {
    if (themeMode === 'system') {
      setThemeMode(theme === 'dark' ? 'light' : 'dark');
    } else {
      setThemeMode(themeMode === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        toggleTheme,
        accentColor,
        setAccentColor,
        customHex,
        setCustomColor,
        bgStyle,
        setBgStyle,
        soundEffects,
        setSoundEffects,
        ACCENT_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
