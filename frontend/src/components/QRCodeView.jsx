import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const QRCodeView = ({ url }) => {
  return (
    <div style={styles.container}>
      <h2>Откройте AR на смартфоне</h2>
      <p>Эта технология требует камеру и гироскоп.</p>
      <div style={styles.qrWrapper}>
        <QRCodeSVG value={url} size={256} />
      </div>
      <p style={styles.link}>{url}</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', textAlign: 'center'
  },
  qrWrapper: { padding: '20px', background: 'white', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
  link: { marginTop: '20px', color: '#666', fontSize: '0.8rem' }
};

export default QRCodeView;