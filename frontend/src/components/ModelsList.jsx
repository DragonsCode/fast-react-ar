import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ModelsList.css';

const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span className="toast-icon">
      {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
    </span>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">×</button>
  </div>
);

const SkeletonCard = () => (
  <div className="model-card skeleton-card">
    <div className="skeleton skeleton-header"></div>
    <div className="skeleton skeleton-id"></div>
    <div className="skeleton-links">
      <div className="skeleton skeleton-label"></div>
      <div className="skeleton skeleton-link"></div>
      <div className="skeleton skeleton-label"></div>
      <div className="skeleton skeleton-link"></div>
    </div>
    <div className="skeleton-actions">
      <div className="skeleton skeleton-btn"></div>
      <div className="skeleton skeleton-btn"></div>
    </div>
  </div>
);

export default function ModelsList() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('https://apiar.dragonscode.uz/api/models');

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      setModels(data.models || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (modelId) => {
    const fullUrl = `${window.location.origin}/view/${modelId}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  };

  return (
    <div className="models-page">
      <div className="models-background"></div>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="models-container">
        <header className="models-header animate-fade-in">
          <div className="header-badge">AR Platform</div>
          <h1>3D Models Gallery</h1>
          <p>Explore and view all available AR models</p>
        </header>

        {error && (
          <div className="error-banner glass-card animate-fade-in">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <div>
                <strong>Connection Error</strong>
                <p>{error}</p>
              </div>
            </div>
            <button onClick={fetchModels} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="models-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && !error && models.length === 0 && (
          <div className="empty-state glass-card animate-fade-in">
            <div className="empty-icon">📦</div>
            <h2>No Models Yet</h2>
            <p>Start by uploading your first 3D model</p>
            <Link to="/upload" className="upload-cta">
              <span>➕</span> Upload Model
            </Link>
          </div>
        )}

        {!loading && !error && models.length > 0 && (
          <>
            <div className="models-stats animate-fade-in">
              <div className="stat-badge glass-card">
                <span className="stat-number">{models.length}</span>
                <span className="stat-label">Models Available</span>
              </div>
            </div>

            <div className="models-grid">
              {models.map((model, index) => (
                <div 
                  key={model.id} 
                  className="model-card glass-card animate-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="card-header">
                    <h3 className="model-title">{model.title}</h3>
                    <span className="model-id">ID: {model.id}</span>
                  </div>

                  <div className="card-links">
                    <div className="link-group">
                      <span className="link-label">
                        <span className="link-icon">🎮</span> GLB
                      </span>
                      <a
                        href={model.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        {model.src.split('/').pop()}
                      </a>
                    </div>

                    <div className="link-group">
                      <span className="link-label">
                        <span className="link-icon">🍎</span> USDZ
                      </span>
                      <a
                        href={model.ios_src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        {model.ios_src.split('/').pop()}
                      </a>
                    </div>
                  </div>

                  <div className="card-actions">
                    <Link to={`/view/${model.id}`} className="action-btn primary">
                      <span>🔮</span> View in AR
                    </Link>
                    <button
                      onClick={() => copyToClipboard(model.id)}
                      className="action-btn secondary"
                    >
                      <span>📋</span> Copy Link
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="models-footer animate-fade-in">
              <Link to="/upload" className="add-model-btn">
                <span>➕</span> Add New Model
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
