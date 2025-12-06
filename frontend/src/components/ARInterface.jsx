import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import '@google/model-viewer';
import QRCodeView from './QRCodeView';

const ARInterface = () => {
  const { id } = useParams();
  const modelViewerRef = useRef(null);
  
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Состояния устройства
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [arMode, setArMode] = useState('scene-viewer quick-look webxr'); 

  useEffect(() => {
    fetch(`${API_BASE}/api/model/${id}`, {
        headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
        }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки данных");
        return res.json();
      })
      .then((item) => {
        // === ЛОГИКА ОБРАБОТКИ ССЫЛОК ===
        let finalSrc = item.src;
        let finalIosSrc = item.ios_src;

        // Если ссылка НЕ начинается на http, значит она локальная -> добавляем API_BASE
        if (!item.src.startsWith('http')) {
            finalSrc = `${API_BASE}/${item.src}`;
        }
        if (!item.ios_src.startsWith('http')) {
            finalIosSrc = `${API_BASE}/${item.ios_src}`;
        }

        setData({
            ...item,
            src: finalSrc,
            ios_src: finalIosSrc
        });
      })
      .catch((err) => setError(err.message));
  }, [id]);

  // Функция запуска AR
  const activateAR = (mode) => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    if (mode === 'system') {
      // Для системного AR (приложение) приоритет:
      // Android -> Scene Viewer, iOS -> Quick Look
      viewer.setAttribute('ar-modes', 'scene-viewer quick-look');
    } else if (mode === 'web') {
      // Для Web AR приоритет WebXR
      viewer.setAttribute('ar-modes', 'webxr scene-viewer');
    }
    
    // Принудительный запуск
    viewer.activateAR();
  };

  // Если открыто с ПК
  if (!isMobile) {
    return <QRCodeView url={window.location.href} />;
  }

  if (loading) return <div style={styles.loader}>Загрузка модели...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h3>{model.title}</h3>
      </header>

      {/* 3D Вьювер */}
      <div style={styles.viewerWrapper}>
        <model-viewer
          ref={modelViewerRef}
          src={model.src}
          ios-src={model.ios_src}
          alt={model.title}
          ar
          ar-scale="auto"
          ar-placement="floor"
          camera-controls
          shadow-intensity="1"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Скрываем стандартную кнопку, у нас свои */}
          <button slot="ar-button" style={{ display: 'none' }}></button>
        </model-viewer>
      </div>

      {/* Панель управления */}
      <div style={styles.controls}>
        <p style={styles.hint}>Покрутите модель пальцем</p>
        
        <div style={styles.buttonGroup}>
          {/* Кнопка 1: Системное приложение (Лучшее качество + Фото) */}
          <button 
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={() => activateAR('system')}
          >
            📱 Системный AR (App)
            <span style={styles.subtext}>Лучше для фото</span>
          </button>

          {/* Кнопка 2: Web AR (Только Android) */}
          {/* На iOS скрываем или делаем неактивной, т.к. Safari не умеет WebXR AR */}
          {!isIOS ? (
            <button 
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => activateAR('web')}
            >
              🌐 Web AR
              <span style={styles.subtext}>Без выхода из браузера</span>
            </button>
          ) : (
             <div style={styles.iosWarning}>Web AR недоступен на iPhone (используйте Системный)</div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5', fontFamily: 'sans-serif' },
  loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
  header: { padding: '15px', background: 'white', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', zIndex: 10 },
  viewerWrapper: { flex: 1, position: 'relative', background: '#fff' },
  controls: { padding: '20px', background: 'white', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', boxShadow: '0 -5px 20px rgba(0,0,0,0.1)' },
  hint: { textAlign: 'center', color: '#888', marginBottom: '15px', fontSize: '0.9rem' },
  buttonGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  btn: { padding: '15px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
  btnPrimary: { background: '#007AFF', color: 'white' },
  btnSecondary: { background: '#E5E5EA', color: '#333' },
  subtext: { fontSize: '0.7rem', fontWeight: 'normal', opacity: 0.9 },
  iosWarning: { textAlign: 'center', fontSize: '0.8rem', color: '#999', padding: '10px' }
};

export default ARInterface;