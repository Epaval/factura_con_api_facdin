import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Login.css';

export default function Login() {
  const [ficha, setFicha] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const passwordRef = useRef(null);
  const navigate = useNavigate();

  // Efecto para verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem('facdin_token');
    if (token) {
      navigate('/dashboard', { replace: true });
    } else {
      setCheckedAuth(true);
    }
  }, [navigate]);

  // Efecto para mostrar temporalmente la contraseña
  useEffect(() => {
    let timeoutId;
    if (passwordVisible) {
      timeoutId = setTimeout(() => {
        setPasswordVisible(false);
      }, 500); // Mostrar por 0.5 segundos
    }
    return () => clearTimeout(timeoutId);
  }, [passwordVisible]);

  const handlePasswordChange = (e) => {
    const newValue = e.target.value;
    setPassword(newValue);
    
    // Mostrar temporalmente la contraseña cuando se escribe
    if (newValue.length > password.length) {
      setPasswordVisible(true);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/usuarios/login', { ficha, password });
      const token = res.data.token;

      localStorage.setItem('facdin_token', token);
      
      if (res.data.usuario) {
        localStorage.setItem('facdin_user', JSON.stringify(res.data.usuario));
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica la autenticación
  if (!checkedAuth) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="auth-loading">
            <div className="loading-spinner large"></div>
            <p>Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🔐</div>
          <h2 className="login-title">Acceso Cajero FACDIN</h2>
          <p className="login-subtitle">Sistema de Facturación Electrónica</p>
        </div>
        
        {error && (
          <div className="login-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="ficha" className="input-label">
              <span className="label-icon">👤</span>
              Ficha de Usuario
            </label>
            <input
              id="ficha"
              type="text"
              placeholder="Ingresa tu ficha"
              value={ficha}
              onChange={(e) => setFicha(e.target.value)}
              className="login-input"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password" className="input-label">
              <span className="label-icon">🔒</span>
              Contraseña
            </label>
            <div className="password-container">
              <input
                ref={passwordRef}
                id="password"
                type={showPassword || passwordVisible ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={handlePasswordChange}
                className="login-input password-input"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <div className="password-hint">
              {passwordVisible && (
                <span className="password-preview">Contraseña visible: {password}</span>
              )}
              {!passwordVisible && password.length > 0 && (
                <span className="password-dots">{'•'.repeat(password.length)}</span>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              '🚀 Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="security-notice">
            <span className="shield-icon">🛡️</span>
            Tu información está protegida
          </p>
        </div>
      </div>
    </div>
  );
}