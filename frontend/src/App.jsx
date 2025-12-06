import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ARPage from './components/ARPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/view/:id" element={<ARPage />} />
        <Route path="*" element={<div>404 - Страница не найдена. Попробуйте /view/christmas</div>} />
      </Routes>
    </Router>
  );
}

export default App;