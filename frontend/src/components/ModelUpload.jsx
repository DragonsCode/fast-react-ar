import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ModelUpload.css';

const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span className="toast-icon">
      {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
    </span>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">×</button>
  </div>
);

export default function ModelUpload() {
  const [formData, setFormData] = useState({
    title: '',
    model_id: '',
    glb_file: null,
    usdz_file: null,
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploadedModel, setUploadedModel] = useState(null);
  const [dragStates, setDragStates] = useState({ glb: false, usdz: false });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const generateModelId = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    setFormData(prev => ({ ...prev, model_id: randomId }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleDrop = (e, fileType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fileType]: false }));
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const expectedExt = fileType === 'glb' ? '.glb' : '.usdz';
      
      if (file.name.endsWith(expectedExt)) {
        const fieldName = fileType === 'glb' ? 'glb_file' : 'usdz_file';
        setFormData(prev => ({ ...prev, [fieldName]: file }));
      } else {
        showToast(`Please drop a ${expectedExt} file`, 'error');
      }
    }
  };

  const handleDragOver = (e, fileType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [fileType]: true }));
  };

  const handleDragLeave = (fileType) => {
    setDragStates(prev => ({ ...prev, [fileType]: false }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return false;
    }
    if (!formData.glb_file) {
      showToast('GLB model file is required', 'error');
      return false;
    }
    if (!formData.usdz_file) {
      showToast('USDZ model file is required', 'error');
      return false;
    }
    if (!formData.glb_file.name.endsWith('.glb')) {
      showToast('GLB file must have .glb extension', 'error');
      return false;
    }
    if (!formData.usdz_file.name.endsWith('.usdz')) {
      showToast('USDZ file must have .usdz extension', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setUploadedModel(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      if (formData.model_id) {
        formDataToSend.append('model_id', formData.model_id);
      }
      formDataToSend.append('glb_file', formData.glb_file);
      formDataToSend.append('usdz_file', formData.usdz_file);

      const response = await fetch('https://apiar.dragonscode.uz/api/upload', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.detail || 'Upload failed', 'error');
        return;
      }

      showToast('Model uploaded successfully!', 'success');
      setUploadedModel(data.model);
      setFormData({
        title: '',
        model_id: '',
        glb_file: null,
        usdz_file: null,
      });
    } catch (error) {
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-background"></div>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="upload-container animate-fade-in">
        <Link to="/models" className="back-link">
          <span>←</span> Back to Models
        </Link>

        <div className="upload-header">
          <div className="header-icon">
            <span>📦</span>
          </div>
          <h1>Upload 3D Model</h1>
          <p>Add your GLB and USDZ files for AR viewing</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form glass-card">
          <div className="form-group">
            <label htmlFor="title">
              <span className="label-icon">📝</span>
              Model Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., My Awesome 3D Model"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label htmlFor="model_id">
              <span className="label-icon">🔑</span>
              Model ID <span className="optional">(optional)</span>
            </label>
            <div className="id-input-group">
              <input
                type="text"
                id="model_id"
                name="model_id"
                value={formData.model_id}
                onChange={handleInputChange}
                placeholder="Auto-generated if empty"
                className="input-field"
              />
              <button
                type="button"
                onClick={generateModelId}
                className="generate-btn"
              >
                Generate
              </button>
            </div>
          </div>

          <div className="files-grid">
            <div 
              className={`file-drop-zone ${dragStates.glb ? 'drag-over' : ''} ${formData.glb_file ? 'has-file' : ''}`}
              onDrop={(e) => handleDrop(e, 'glb')}
              onDragOver={(e) => handleDragOver(e, 'glb')}
              onDragLeave={() => handleDragLeave('glb')}
            >
              <input
                type="file"
                id="glb_file"
                name="glb_file"
                accept=".glb"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="glb_file" className="file-label">
                <div className="file-icon">🎮</div>
                <div className="file-info">
                  <span className="file-type">GLB File</span>
                  <span className="file-platform">Android / Web</span>
                </div>
                {formData.glb_file ? (
                  <div className="file-selected">
                    <span className="check">✓</span>
                    <span className="filename">{formData.glb_file.name}</span>
                  </div>
                ) : (
                  <span className="file-hint">Drop file or click to browse</span>
                )}
              </label>
            </div>

            <div 
              className={`file-drop-zone ${dragStates.usdz ? 'drag-over' : ''} ${formData.usdz_file ? 'has-file' : ''}`}
              onDrop={(e) => handleDrop(e, 'usdz')}
              onDragOver={(e) => handleDragOver(e, 'usdz')}
              onDragLeave={() => handleDragLeave('usdz')}
            >
              <input
                type="file"
                id="usdz_file"
                name="usdz_file"
                accept=".usdz"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="usdz_file" className="file-label">
                <div className="file-icon">🍎</div>
                <div className="file-info">
                  <span className="file-type">USDZ File</span>
                  <span className="file-platform">iOS / macOS</span>
                </div>
                {formData.usdz_file ? (
                  <div className="file-selected">
                    <span className="check">✓</span>
                    <span className="filename">{formData.usdz_file.name}</span>
                  </div>
                ) : (
                  <span className="file-hint">Drop file or click to browse</span>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Uploading...
              </>
            ) : (
              <>
                <span>🚀</span>
                Upload Model
              </>
            )}
          </button>
        </form>

        {uploadedModel && (
          <div className="success-card glass-card animate-scale-in">
            <div className="success-header">
              <span className="success-icon">🎉</span>
              <h2>Upload Successful!</h2>
            </div>
            <div className="model-details">
              <div className="detail-row">
                <span className="detail-label">Title</span>
                <span className="detail-value">{uploadedModel.title}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">GLB URL</span>
                <a href={uploadedModel.src} target="_blank" rel="noopener noreferrer" className="detail-link">
                  {uploadedModel.src}
                </a>
              </div>
              <div className="detail-row">
                <span className="detail-label">USDZ URL</span>
                <a href={uploadedModel.ios_src} target="_blank" rel="noopener noreferrer" className="detail-link">
                  {uploadedModel.ios_src}
                </a>
              </div>
            </div>
            <Link to={`/view/${uploadedModel.id || formData.model_id}`} className="view-model-btn">
              View in AR →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
