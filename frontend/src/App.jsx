import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ARPage from './components/ARPage';
import ModelUpload from './components/ModelUpload';
import ModelsList from './components/ModelsList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/view/:id" element={<ARPage />} />
        <Route path="/upload" element={<ModelUpload />} />
        <Route path="/models" element={<ModelsList />} />
        <Route path="/" element={<ModelsList />} />
        <Route path="*" element={<div>404 - Страница не найдена. Попробуйте /view/christmas</div>} />
      </Routes>
    </Router>
  );
}

export default App;