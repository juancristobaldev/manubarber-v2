'use client';

import { useEffect, useState } from 'react';

interface SiteLoaderProps {
  error?: Error;
  text?: string;
  minDurationMs?: number;
}

export function SiteLoader({ error, text = 'CARGANDO EXPERIENCIA', minDurationMs = 0 }: SiteLoaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="manubarber-loader" role="status" aria-live="polite">
      <div className="loader-backdrop" />
      <div className="loader-ambient-glow" />

      <div className="loader-content">
        <div className="loader-logo-frame">
          <img
            src="/images/manu-logo-animated.svg"
            alt="ManuBarber Logo"
            className="loader-logo-svg"
            width={180}
            height={180}
          />
          <div className="loader-ring-pulse" />
        </div>

        <div className="loader-info">
          <h2 className="loader-brand-title">
            MANU<em>BARBER</em>
          </h2>
          <p className="loader-tagline">STREET PRECISION</p>

          {error ? (
            <div className="loader-error-box">
              <p className="loader-error-text">No se pudo conectar con el servidor.</p>
              <small className="loader-error-detail">{error.message}</small>
              <button
                className="loader-retry-btn"
                onClick={() => window.location.reload()}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="loader-status-container">
              <div className="loader-progress-bar">
                <div className="loader-progress-fill" />
              </div>
              <span className="loader-status-text">
                {text}
                <span className="loader-dots">{dots}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
