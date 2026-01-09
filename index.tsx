
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Studio inicializado com sucesso.");
  } catch (error) {
    console.error("Erro ao renderizar o Studio:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: #ff4444; font-family: monospace;">Erro crítico: ${error}</div>`;
  }
} else {
  console.error("Elemento root não encontrado.");
}
