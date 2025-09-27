import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IngresarApiKey() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar formato básico de apiKey
    if (!apiKey.startsWith('fcd_') || apiKey.length < 20) {
      setError('API Key inválida. Debe empezar con "fcd_"');
      return;
    }

    // Guardar en localStorage
    localStorage.setItem('facdin_apikey', apiKey);

    // Ir al login
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center mb-6">🔐 Acceso a FACDIN</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Ingresa tu API Key para continuar
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Ingresa tu API Key (fcd_xxx...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded mb-4 font-mono text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}