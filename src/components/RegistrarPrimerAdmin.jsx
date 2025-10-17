// src/components/RegistrarPrimerAdmin.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function RegistrarPrimerAdmin() {
  const [form, setForm] = useState({
    nombre: '',
    ficha: '',
    ci: '',
    email: '',
    password: '',
    repetirPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const apiKey = new URLSearchParams(location.search).get('key');

  // Si ya existe un admin, redirigir al login
  useEffect(() => {
    const verificarAdminExistente = async () => {
      try {
        const res = await api.get('/usuarios/primero-existe', {
          headers: { 'x-api-key': apiKey }
        });
        if (res.data.existe) {
          navigate('/login');
        }
      } catch (err) {
        console.error('No se pudo verificar admin');
      }
    };

    if (apiKey) {
      localStorage.setItem('facdin_apikey', apiKey);
      verificarAdminExistente();
    } else {
      navigate('/registro-error');
    }
  }, [apiKey, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.repetirPassword) {
      return setError('Las contraseñas no coinciden');
    }

    if (!apiKey) {
      return setError('API Key no válida');
    }

    setLoading(true);

    try {
      await api.post('/usuarios/registrar-primer-admin', form, {
        headers: { 'x-api-key': apiKey }
      });

      alert('✅ Primer administrador registrado con éxito');
      navigate('/login');

    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Error al registrar el primer administrador'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">🔐 Primer Administrador</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Registra el superadministrador.
        </p>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-6 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Nombre completo *"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            required
          />
          <input
            placeholder="Ficha única *"
            name="ficha"
            value={form.ficha}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            required
          />
          <input
            placeholder="Cédula de Identidad *"
            name="ci"
            type="number"
            value={form.ci}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            required
          />
          <input
            placeholder="Email (opcional)"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded"
          />
          <input
            placeholder="Contraseña *"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            required
          />
          <input
            placeholder="Repetir contraseña *"
            name="repetirPassword"
            type="password"
            value={form.repetirPassword}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? 'Registrando...' : '💾 Registrar Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}