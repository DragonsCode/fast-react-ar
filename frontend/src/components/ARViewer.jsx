import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '@google/model-viewer';

const ARViewer = () => {
  const { id } = useParams();
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Загружаем данные о модели с нашего бэкенда
    fetch(`https://3b30aea07c87.ngrok-free.app/api/ar-item/${id}`, {headers: {'ngrok-skip-browser-warning': true}})
      .then((res) => {
        if (!res.ok) throw new Error('Модель не найдена');
        return res.json();
      })
      .then((data) => {
        setModelData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={styles.center}>Загрузка магии...</div>;
  if (error) return <div style={styles.center}>Ошибка: {error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>{modelData.title}</h1>
      
      {/* 
         Компонент model-viewer
         ar - включает AR режим
         ar-modes - приоритет режимов (scene-viewer для Android, quick-look для iOS, webxr для веба)
         camera-controls - позволяет крутить модель пальцем на экране
         ar-placement="floor" - позволяет ставить объект на пол/стены (World Tracking)
         ar-scale="auto" - фиксированный размер
      */}
      <model-viewer
        src={modelData.src}
        ios-src={modelData.ios_src}
        alt={modelData.alt}
        ar
        ar-modes="scene-viewer webxr quick-look"
        camera-controls
        ar-placement="floor" 
        shadow-intensity="1"
        style={styles.viewer}
      >
        {/* Кнопка активации AR (кастомная) */}
        <button slot="ar-button" style={styles.arButton}>
          📸 Открыть в AR и сфоткаться
        </button>

        <div id="ar-prompt">
          <img src="https://modelviewer.dev/shared-assets/icons/hand.png" alt="hand" />
        </div>
      </model-viewer>

      <div style={styles.instructions}>
        <p>1. Нажмите кнопку "Открыть в AR"</p>
        <p>2. Наведите камеру на пол или стол</p>
        <p>3. Рамка появится! Вы можете перемещать её и крутить.</p>
        <p>4. Нажмите кнопку затвора в AR режиме, чтобы сделать фото.</p>
      </div>
    </div>
  );
};

// Простые стили
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f0f0',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    margin: '20px',
    fontSize: '1.5rem',
    color: '#333'
  },
  center: {
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh'
  },
  viewer: {
    width: '100%',
    height: '60vh',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
  },
  arButton: {
    backgroundColor: '#ff4081',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    padding: '12px 24px',
    fontSize: '16px',
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
  },
  instructions: {
    padding: '20px',
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9rem'
  }
};

export default ARViewer;