import React, { useState } from 'react';
import './ModelUpload.css';

export default function ModelUpload() {
  const [formData, setFormData] = useState({
    title: '',
    model_id: '',
    glb_file: null,
    usdz_file: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [uploadedModel, setUploadedModel] = useState(null);

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

  const validateForm = () => {
    if (!formData.title.trim()) {
      setMessage('Title is required');
      setMessageType('error');
      return false;
    }

    if (!formData.glb_file) {
      setMessage('GLB model file is required');
      setMessageType('error');
      return false;
    }

    if (!formData.usdz_file) {
      setMessage('USDZ model file is required');
      setMessageType('error');
      return false;
    }

    if (!formData.glb_file.name.endsWith('.glb')) {
      setMessage('GLB file must have .glb extension');
      setMessageType('error');
      return false;
    }

    if (!formData.usdz_file.name.endsWith('.usdz')) {
      setMessage('USDZ file must have .usdz extension');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');
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
        setMessage(data.detail || 'Upload failed');
        setMessageType('error');
        return;
      }

      setMessage(data.message);
      setMessageType('success');
      setUploadedModel(data.model);
      
      // Reset form
      setFormData({
        title: '',
        model_id: '',
        glb_file: null,
        usdz_file: null,
      });
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="model-upload-container">
      <h1>Upload 3D Model</h1>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Model Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="e.g., My Awesome Model"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="model_id">Model ID (optional)</label>
          <div className="id-input-group">
            <input
              type="text"
              id="model_id"
              name="model_id"
              value={formData.model_id}
              onChange={handleInputChange}
              placeholder="Auto-generated if left empty"
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

        <div className="form-group">
          <label htmlFor="glb_file">GLB Model File *</label>
          <input
            type="file"
            id="glb_file"
            name="glb_file"
            accept=".glb"
            onChange={handleFileChange}
            required
          />
          {formData.glb_file && (
            <span className="file-name">
              ✓ {formData.glb_file.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="usdz_file">USDZ Model File (iOS) *</label>
          <input
            type="file"
            id="usdz_file"
            name="usdz_file"
            accept=".usdz"
            onChange={handleFileChange}
            required
          />
          {formData.usdz_file && (
            <span className="file-name">
              ✓ {formData.usdz_file.name}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload Model'}
        </button>
      </form>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {uploadedModel && (
        <div className="success-info">
          <h2>Upload Successful! 🎉</h2>
          <div className="model-details">
            <p><strong>Title:</strong> {uploadedModel.title}</p>
            <p><strong>GLB URL:</strong> <a href={uploadedModel.src} target="_blank" rel="noopener noreferrer">{uploadedModel.src}</a></p>
            <p><strong>USDZ URL:</strong> <a href={uploadedModel.ios_src} target="_blank" rel="noopener noreferrer">{uploadedModel.ios_src}</a></p>
          </div>
        </div>
      )}
    </div>
  );
}
