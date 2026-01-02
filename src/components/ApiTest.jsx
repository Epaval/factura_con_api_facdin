// src/components/ApiTest.jsx
import {  useState } from 'react';
import { api } from '../services/api';

export default function ApiTest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Asumimos que tu backend tiene un endpoint de prueba
      // Si no, cambia '/facturas' por cualquier endpoint real que exista
      const response = await api.get('/facturas'); // o '/status', '/ping', etc.
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Error desconocido');
      console.error('Error en prueba de API:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
      <h3>🔧 Prueba de Conexión a la API</h3>
      <button onClick={testConnection} disabled={loading}>
        {loading ? 'Conectando...' : 'Probar conexión'}
      </button>

      {error && <p style={{ color: 'red' }}>❌ Error: {error}</p>}
      {result && (
        <div>
          <p>✅ Respuesta recibida:</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}