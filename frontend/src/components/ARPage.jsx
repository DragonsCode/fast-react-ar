import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import '@google/model-viewer';
import './ARPage.css';

const API_BASE = "https://apiar.dragonscode.uz";

const Skeleton = ({ className }) => (
  <div className={`skeleton ${className || ''}`}></div>
);

const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">×</button>
  </div>
);

const ARPage = () => {
  const { id } = useParams();
  const viewerRef = useRef(null);
  const [data, setData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    setError(null);
    setLoading(true);

    fetch(`${API_BASE}/api/model/${id}`, {
      method: 'GET',
      headers: new Headers({
        "ngrok-skip-browser-warning": "69420",
        "Content-Type": "application/json",
        "User-Agent": "CustomAgent"
      }),
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          throw new Error("Failed to load model data. Please try again.");
        }
      })
      .then((item) => {
        setData(item);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const launchAR = (mode) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (mode === 'system') {
      viewer.setAttribute('ar-modes', 'scene-viewer quick-look');
    } else {
      viewer.setAttribute('ar-modes', 'webxr scene-viewer');
    }

    setTimeout(() => {
      if (viewer.canActivateAR) {
        viewer.activateAR();
      } else {
        showToast("Unable to activate AR. Please use Safari on iOS or Chrome on Android.", 'error');
      }
    }, 100);
  };

  if (error) {
    return (
      <div className="ar-page">
        <div className="ar-background"></div>
        <div className="error-container animate-fade-in">
          <div className="error-card glass-card">
            <div className="error-icon">⚠️</div>
            <h2>Loading Error</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ar-page">
        <div className="ar-background"></div>
        <div className={`ar-container ${isMobile ? 'mobile' : 'desktop'}`}>
          <div className="model-wrapper">
            <div className="model-skeleton">
              <div className="skeleton-cube"></div>
              <p>Loading 3D Model...</p>
            </div>
          </div>
          {!isMobile && (
            <div className="sidebar glass-card animate-slide-in">
              <Skeleton className="skeleton-title" />
              <Skeleton className="skeleton-qr" />
              <Skeleton className="skeleton-link" />
            </div>
          )}
          {isMobile && (
            <div className="mobile-controls glass-card animate-slide-up">
              <Skeleton className="skeleton-title-mobile" />
              <div className="buttons-row">
                <Skeleton className="skeleton-btn" />
                <Skeleton className="skeleton-btn" />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ar-page">
      <div className="ar-background"></div>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className={`ar-container ${isMobile ? 'mobile' : 'desktop'} animate-fade-in`}>
        <div className="model-wrapper">
          <model-viewer
            ref={viewerRef}
            src={data.src}
            ios-src={data.ios_src}
            alt={data.title}
            camera-controls
            auto-rotate
            ar
            ar-scale="auto"
            ar-placement="floor"
            ar-modes="webxr scene-viewer quick-look"
            shadow-intensity="1"
            crossorigin="anonymous"
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
          >
            <div slot="ar-button" style={{ display: 'none' }}></div>
          </model-viewer>
        </div>

        {!isMobile && (
          <div className="sidebar glass-card animate-slide-in">
            <div className="sidebar-content">
              <div className="sidebar-header">
                <span className="badge">3D Model</span>
                <h1>{data.title}</h1>
              </div>
              <div className="qr-section">
                <p className="qr-label">Scan to view on mobile</p>
                <div className="qr-box">
                  <QRCodeSVG 
                    value={window.location.href} 
                    size={180}
                    bgColor="transparent"
                    fgColor="#00d4ff"
                    level="H"
                  />
                </div>
                <p className="link-text">{window.location.href}</p>
              </div>
              <div className="sidebar-footer">
                <div className="feature-badge">
                  <span className="icon">🔮</span>
                  <span>AR Ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isMobile && (
          <div className="mobile-controls glass-card animate-slide-up">
            <div className="mobile-header">
              <span className="badge">3D Model</span>
              <h3>{data.title}</h3>
            </div>
            <div className="buttons-row">
              <button className="btn-ar btn-app" onClick={() => launchAR('system')}>
                <span className="btn-icon">📱</span>
                <span className="btn-text">App AR</span>
                <span className="btn-subtitle">Best quality</span>
              </button>
              <button className="btn-ar btn-web" onClick={() => launchAR('web')}>
                <span className="btn-icon">🌐</span>
                <span className="btn-text">Web AR</span>
                <span className="btn-subtitle">Quick preview</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ARPage;