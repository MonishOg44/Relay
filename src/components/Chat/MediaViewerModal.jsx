import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { animate } from 'animejs';

export default function MediaViewerModal({ items, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, items]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
  }, [items.length]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  if (!items || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const isVideo = currentItem?.type?.startsWith('video');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0,0,0,0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.2s ease forwards',
      }}
      onClick={onClose}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          color: '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '15px', fontWeight: 600 }}>
          {currentIndex + 1} of {items.length}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href={currentItem.url}
            download={currentItem.name || 'media_file'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ffffff', opacity: 0.8 }}
            title="Download Original"
          >
            <Download size={24} />
          </a>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: 0,
              opacity: 0.8,
            }}
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 40px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              backdropFilter: 'blur(4px)',
            }}
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div
          key={currentIndex} // forces re-render for animation
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {isVideo ? (
            <video
              src={currentItem.url}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
          ) : (
            <img
              src={currentItem.url}
              alt={currentItem.name || 'Shared Media'}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
          )}
        </div>

        {currentIndex < items.length - 1 && (
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '16px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#ffffff',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              backdropFilter: 'blur(4px)',
            }}
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
      
      {/* Footer Text */}
      <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
        {currentItem.name}
      </div>
    </div>
  );
}
