import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

export const StaggeredMenu = ({
  position = 'right',
  colors = ['#10b981', '#06b6d4'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = '',
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  accentColor = '#10b981',
  changeMenuColorOnOpen = true,
  isFixed = false,
  closeOnClickAway = true,
  customToggle,
  isOpen: externalIsOpen,
  onMenuOpen,
  onMenuClose
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef(null);
  const preLayersRef = useRef(null);
  const preLayerElsRef = useRef([]);
  const plusHRef = useRef(null);
  const plusVRef = useRef(null);
  const iconRef = useRef(null);
  const textInnerRef = useRef(null);
  const textWrapRef = useRef(null);
  const [textLines, setTextLines] = useState(['Menu', 'Close']);

  const openTlRef = useRef(null);
  const closeTweenRef = useRef(null);
  const spinTweenRef = useRef(null);
  const textCycleAnimRef = useRef(null);
  const colorTweenRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const busyRef = useRef(false);
  const itemEntranceTweenRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      if (!panel) return;

      let preLayers = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer'));
      }
      preLayerElsRef.current = preLayers;

      if (!openRef.current) {
        const offscreen = position === 'left' ? -100 : 100;
        gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1, visibility: 'hidden' });
      }
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }
      if (plusHRef.current) gsap.set(plusHRef.current, { transformOrigin: '50% 50%', rotate: 0 });
      if (plusVRef.current) gsap.set(plusVRef.current, { transformOrigin: '50% 50%', rotate: 90 });
      if (iconRef.current) gsap.set(iconRef.current, { rotate: 0, transformOrigin: '50% 50%' });
      if (textInnerRef.current) gsap.set(textInnerRef.current, { yPercent: 0 });
      if (!customToggle && toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position, customToggle]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel, .sm-panel-itemNum'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 25, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });
    tl.set([panel, ...layers], { visibility: 'visible', display: 'flex', opacity: 1 }, 0);

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start, opacity: 1 }, { xPercent: 0, opacity: 1, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: panelStart, opacity: 1 },
      { xPercent: 0, opacity: 1, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.08, from: 'start' }
        },
        itemsStart
      );
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
          },
          socialsStart
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (panelRef.current) {
      gsap.set(panelRef.current, { display: 'flex', visibility: 'visible' });
    }
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    if (!panel) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      return;
    }

    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;

    closeTweenRef.current = gsap.to(panel, {
      xPercent: offscreen,
      duration: 0.38,
      ease: 'power3.inOut',
      force3D: true,
      overwrite: 'all',
      onComplete: () => {
        gsap.set(panel, { visibility: 'hidden', display: 'none', xPercent: offscreen });
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel, .sm-panel-itemNum'));
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        openRef.current = false;
        setOpen(false);
        onMenuClose?.();
        busyRef.current = false;
      }
    });
  }, [position, onMenuClose]);

  const animateIcon = useCallback(opening => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    } else {
      spinTweenRef.current = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }, []);

  const animateColor = useCallback(
    opening => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.18,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  React.useEffect(() => {
    if (toggleBtnRef.current) {
      if (changeMenuColorOnOpen) {
        const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
        gsap.set(toggleBtnRef.current, { color: targetColor });
      } else {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback(opening => {
    const inner = textInnerRef.current;
    if (!inner) return;
    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu';
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);
    setTextLines(seq);

    gsap.set(inner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out'
    });
  }, []);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [playClose, animateIcon, animateColor, animateText]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    if (target) {
      openRef.current = true;
      setOpen(true);
      onMenuOpen?.();
      playOpen();
      animateIcon(true);
      animateColor(true);
      animateText(true);
    } else {
      closeMenu();
    }
  }, [playOpen, closeMenu, animateIcon, animateColor, animateText, onMenuOpen]);

  React.useEffect(() => {
    if (typeof externalIsOpen === 'boolean' && externalIsOpen !== openRef.current) {
      if (externalIsOpen) {
        if (!openRef.current) {
          openRef.current = true;
          setOpen(true);
          onMenuOpen?.();
          playOpen();
          animateIcon(true);
          animateColor(true);
          animateText(true);
        }
      } else {
        if (openRef.current) {
          closeMenu();
        }
      }
    }
  }, [externalIsOpen, playOpen, closeMenu, animateIcon, animateColor, animateText, onMenuOpen]);

  React.useEffect(() => {
    const handleHide = () => {
      if (document.visibilityState === 'hidden' && openRef.current) {
        closeMenu();
      }
    };

    document.addEventListener('visibilitychange', handleHide);
    return () => {
      document.removeEventListener('visibilitychange', handleHide);
    };
  }, [closeMenu]);

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = event => {
      if (
        event.target &&
        event.target.closest &&
        (event.target.closest('.modal-overlay') ||
         event.target.closest('.modal-card') ||
         event.target.closest('[class*="modal"]'))
      ) {
        return;
      }

      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  return (
    <div
      className={(className ? className + ' ' : '') + 'staggered-menu-wrapper' + (isFixed ? ' fixed-wrapper' : '')}
      style={accentColor ? { ['--sm-accent']: accentColor } : undefined}
      data-position={position}
      data-open={open || undefined}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {(() => {
          const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
          let arr = [...raw];
          if (arr.length >= 3) {
            const mid = Math.floor(arr.length / 2);
            arr.splice(mid, 1);
          }
          return arr.map((c, i) => <div key={i} className="sm-prelayer" style={{ background: c }} />);
        })()}
      </div>
      <header className="staggered-menu-header">
        {logoUrl && (
          <div className="sm-logo-wrap">
            <img className="sm-logo" src={logoUrl} alt="Logo" width={110} height={24} />
          </div>
        )}
        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
          style={customToggle ? { background: 'none', border: 'none', padding: 0, boxShadow: 'none' } : undefined}
        >
          {customToggle ? (
            customToggle(open)
          ) : (
            <>
              <span ref={textWrapRef} className="sm-toggle-textWrap" aria-hidden="true">
                <span ref={textInnerRef} className="sm-toggle-textInner">
                  {textLines.map((l, i) => (
                    <span className="sm-toggle-line" key={i}>
                      {l}
                    </span>
                  ))}
                </span>
              </span>
              <span ref={iconRef} className="sm-icon" aria-hidden="true">
                <span ref={plusHRef} className="sm-icon-line" />
                <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
              </span>
            </>
          )}
        </button>
      </header>

      <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel" aria-hidden={!open}>
        <div className="sm-panel-inner">
          <div className="sm-panel-header">
            <h2 className="sm-header-title">CONTROL CENTER</h2>
          </div>

          <ul className="sm-panel-list" role="list">
            {items && items.length ? (
              items.map((it, idx) => (
                <li className="sm-panel-itemWrap" key={it.label + idx}>
                  {it.onClick ? (
                    <button
                      type="button"
                      className="sm-panel-item"
                      onClick={() => {
                        it.onClick();
                      }}
                    >
                      <span className="sm-panel-itemLabel">{it.label}</span>
                      {displayItemNumbering && (
                        <span className="sm-panel-itemNum">{String(idx + 1).padStart(2, '0')}</span>
                      )}
                    </button>
                  ) : (
                    <a className="sm-panel-item" href={it.link || '#'} onClick={() => closeMenu()} aria-label={it.ariaLabel}>
                      <span className="sm-panel-itemLabel">{it.label}</span>
                      {displayItemNumbering && (
                        <span className="sm-panel-itemNum">{String(idx + 1).padStart(2, '0')}</span>
                      )}
                    </a>
                  )}
                </li>
              ))
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">No items</span>
                </span>
              </li>
            )}
          </ul>

          <div className="sm-panel-footer">
            <button
              type="button"
              className="sm-panel-title sm-panel-close-btn"
              onClick={() => closeMenu()}
            >
              CLOSE <span className="sm-close-arrow">↑</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;
