import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, ZoomIn, ZoomOut, Check, RefreshCw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function BannerCropperModal({ isOpen, imageSrc, onClose, onCropComplete }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleApplyCrop = () => {
    const canvas = document.createElement('canvas');
    const outW = 900;
    const outH = 300;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');

    const img = imageRef.current;
    if (!img) return;

    ctx.clearRect(0, 0, outW, outH);

    const containerW = 360;
    const containerH = 120;
    const scale = zoom;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerW / containerH;
    
    let drawW, drawH;

    if (imgAspect >= containerAspect) {
      drawH = containerH * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = containerW * scale;
      drawH = drawW / imgAspect;
    }

    const scaleFactorW = outW / containerW;
    const scaleFactorH = outH / containerH;
    
    const drawX = (outW - drawW * scaleFactorW) / 2 + panX * scaleFactorW;
    const drawY = (outH - drawH * scaleFactorH) / 2 + panY * scaleFactorH;

    ctx.drawImage(img, drawX, drawY, drawW * scaleFactorW, drawH * scaleFactorH);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCropComplete(croppedDataUrl);
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999999,
        background: isDark ? '#000000' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          margin: 'auto',
          background: isDark ? '#0b0e14' : '#ffffff',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: isDark ? 'var(--accent-contrast-text)' : '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Crop Banner Photo
            </h3>
            <p style={{ fontSize: '12px', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#64748b', margin: '2px 0 0' }}>
              Drag to move, slider to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              padding: 0,
              zIndex: 20,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            title="Close"
          >
            <X size={20} style={{ display: 'block', margin: 'auto' }} />
          </button>
        </div>

        {/* Wide Crop Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            height: '120px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#000000',
            border: '2px solid var(--accent-green, #00a884)',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            marginBottom: '20px',
          }}
        >
          {/* Image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop target"
            draggable={false}
            style={{
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              pointerEvents: 'none',
            }}
          />

          {/* Minimal 3x3 Grid Lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gridTemplateRows: '1fr 1fr 1fr',
            }}
          >
            <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.15)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} />
            <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.15)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} />
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} />

            <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.15)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} />
            <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.15)', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} />
            <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }} />

            <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.15)' }} />
            <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.15)' }} />
            <div />
          </div>
        </div>

        {/* Zoom Slider */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
          <ZoomOut size={15} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b'} />
          <input
            type="range"
            min="1"
            max="3"
            step="0.04"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent-green, #00a884)', cursor: 'pointer' }}
          />
          <ZoomIn size={15} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b'} />
          <button
            type="button"
            onClick={handleReset}
            title="Reset position & zoom"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              color: isDark ? 'var(--accent-contrast-text)' : '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Simple & Clean Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              border: 'none',
              color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#334155',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '10px',
              background: 'var(--accent-green, #00a884)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0, 168, 132, 0.3)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 168, 132, 0.4)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 168, 132, 0.3)'; }}
          >
            <Check size={16} />
            Apply Banner
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(modalContent, document.body);
  }
  return null;
}
