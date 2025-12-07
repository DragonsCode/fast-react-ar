import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import '@google/model-viewer';
import './ARPage.css';

// Ссылка на бэкенд
const API_BASE = "https://apiar.dragonscode.uz"; 

const ARPage = () => {
  const { id } = useParams();
  const viewerRef = useRef(null);
  const [data, setData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    // 1. Сбрасываем ошибку перед новым запросом
    setError(null);
    console.log("Запрос к:", `${API_BASE}/api/model/${id}`);

    fetch(`${API_BASE}/api/model/${id}`, {
        method: 'GET',
        headers: new Headers({
            "ngrok-skip-browser-warning": "69420",
            "Content-Type": "application/json",
            // Иногда добавление User-Agent помогает обойти ngrok check
            "User-Agent": "CustomAgent" 
        }),
    })
      .then(async (res) => {
        // 2. Сначала читаем как текст, чтобы проверить, не пришел ли HTML
        const text = await res.text();
        
        if (!res.ok) {
            throw new Error(`Ошибка сервера: ${res.status}`);
        }

        try {
            // 3. Пробуем парсить JSON
            const json = JSON.parse(text);
            return json;
        } catch (e) {
            // Если упало здесь — значит пришел HTML (страница ngrok warning)
            console.error("Пришел не JSON, а:", text.substring(0, 100));
            throw new Error("Ngrok заблокировал запрос. Нажмите 'Visit Site' если видите кнопку, или смените туннель.");
        }
      })
      .then((item) => {
        console.log("Данные успешно получены:", item);
        setData(item);
      })
      .catch((err) => {
        console.error("Ошибка fetch:", err);
        setError(err.message);
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
            alert("Не удалось активировать AR. Убедитесь, что вы используете Safari на iOS или Chrome на Android.");
        }
    }, 100);
  };

  // Красивый вывод ошибки на экран телефона
  if (error) return (
    <div style={{padding: 20, textAlign: 'center', paddingTop: '40vh'}}>
        <h3>Ошибка загрузки</h3>
        <p style={{color: 'red'}}>{error}</p>
        <p style={{fontSize: '0.8rem', color: '#666'}}>Попробуйте обновить страницу</p>
    </div>
  );

  if (!data) return <div className="loading-screen">Загрузка...</div>;

  return (
    <div className={`container ${isMobile ? 'mobile' : 'desktop'}`}>
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
          style={{ width: '100%', height: '100%', backgroundColor: '#eee' }}
          onError={(e) => {
              console.error("Model Viewer Error:", e);
              // alert("Ошибка отображения 3D файла"); // Можно раскомментировать для отладки
          }}
        >
            <div slot="ar-button" style={{display: 'none'}}></div>
        </model-viewer>
      </div>

      {!isMobile && (
        <div className="sidebar">
          <h1>{data.title}</h1>
          <div className="qr-box">
             <QRCodeSVG value={window.location.href} size={200} />
          </div>
          <p className="link-text" style={{fontSize: '10px'}}>{window.location.href}</p>
        </div>
      )}

      {isMobile && (
        <div className="mobile-controls">
            <h3>{data.title}</h3>
            <div className="buttons-row">
                <button className="btn btn-primary" onClick={() => launchAR('system')}>
                    📱 App AR
                </button>
                <button className="btn btn-secondary" onClick={() => launchAR('web')}>
                    🌐 Web AR
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ARPage;