import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ModelsList.css';

export default function ModelsList() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      console.error('Error fetching models:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="models-list-container">
      <div className="models-header">
        <h1>🎭 Available 3D Models</h1>
        <p className="subtitle">Explore and view all available AR models</p>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading models...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={fetchModels} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && models.length === 0 && (
        <div className="empty-state">
          <p>No models available yet</p>
          <Link to="/upload" className="upload-link">
            Upload your first model
          </Link>
        </div>
      )}

      {!loading && !error && models.length > 0 && (
        <div className="models-content">
          <div className="models-count">
            {models.length} model{models.length !== 1 ? 's' : ''} available
          </div>

          <div className="models-grid">
            {models.map((model) => (
              <div key={model.id} className="model-card">
                <div className="model-card-header">
                  <h3 className="model-title">{model.title}</h3>
                  <span className="model-id">ID: {model.id}</span>
                </div>

                <div className="model-card-links">
                  <div className="link-item">
                    <strong>GLB (Android/Web)</strong>
                    <a 
                      href={model.src} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Download GLB file"
                      className="file-link"
                    >
                      {model.src.split('/').pop()}
                    </a>
                  </div>

                  <div className="link-item">
                    <strong>USDZ (iOS)</strong>
                    <a 
                      href={model.ios_src} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Download USDZ file"
                      className="file-link"
                    >
                      {model.ios_src.split('/').pop()}
                    </a>
                  </div>
                </div>

                <div className="model-card-actions">
                  <Link 
                    to={`/view/${model.id}`} 
                    className="view-btn primary"
                    title="View this model in AR"
                  >
                    View in AR
                  </Link>
                  <button 
                    onClick={() => copyToClipboard(`/view/${model.id}`)}
                    className="copy-btn secondary"
                    title="Copy view link to clipboard"
                  >
                    📋 Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="models-footer">
            <Link to="/upload" className="upload-btn">
              ➕ Upload New Model
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function copyToClipboard(text) {
  const fullUrl = `${window.location.origin}/view/${text.split('/').pop()}`;
  navigator.clipboard.writeText(fullUrl).then(() => {
    alert('Link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}
