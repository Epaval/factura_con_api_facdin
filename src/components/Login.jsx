// src/components/Login.jsx
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
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  
  const passwordRef = useRef(null);
  const fichaRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Verificar bloqueo por intentos fallidos
  useEffect(() => {
    const storedAttempts = localStorage.getItem('login_attempts');
    const lockUntil = localStorage.getItem('lock_until');
    
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
    
    if (lockUntil && Date.now() < parseInt(lockUntil)) {
      setIsLocked(true);
      const remaining = Math.ceil((parseInt(lockUntil) - Date.now()) / 1000);
      setLockTime(remaining);
    }
  }, []);

  // ✅ Actualizar contador de bloqueo
  useEffect(() => {
    let timer;
    if (isLocked && lockTime > 0) {
      timer = setInterval(() => {
        setLockTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            localStorage.removeItem('lock_until');
            localStorage.removeItem('login_attempts');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockTime]);

  // ✅ Efecto para verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem('facdin_token');
    const rememberToken = localStorage.getItem('facdin_remember_token');
    
    if (token || rememberToken) {
      navigate('/dashboard', { replace: true });
    } else {
      setCheckedAuth(true);
    }
  }, [navigate]);

  // ✅ Efecto para mostrar temporalmente la contraseña
  useEffect(() => {
    let timeoutId;
    if (passwordVisible) {
      timeoutId = setTimeout(() => {
        setPasswordVisible(false);
      }, 500);
    }
    return () => clearTimeout(timeoutId);
  }, [passwordVisible]);

  // ✅ Efecto para autofocus en el primer campo
  useEffect(() => {
    if (checkedAuth && fichaRef.current) {
      fichaRef.current.focus();
    }
  }, [checkedAuth]);

  const handlePasswordChange = (e) => {
    const newValue = e.target.value;
    setPassword(newValue);
    
    if (newValue.length > password.length) {
      setPasswordVisible(true);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ✅ Función para manejar bloqueo por intentos
  const handleFailedAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem('login_attempts', newAttempts.toString());
    localStorage.setItem('last_login_attempt', Date.now().toString());
    
    if (newAttempts >= 5) {
      const lockDuration = 5 * 60 * 1000; // 5 minutos
      const lockUntil = Date.now() + lockDuration;
      setIsLocked(true);
      setLockTime(Math.ceil(lockDuration / 1000));
      localStorage.setItem('lock_until', lockUntil.toString());
      setError(`Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.`);
    } else {
      setError(`Credenciales incorrectas. Intentos restantes: ${5 - newAttempts}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      setError(`Cuenta bloqueada. Intente nuevamente en ${lockTime} segundos.`);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/usuarios/login', { 
        ficha, 
        password,
        remember: rememberMe 
      });
      const token = res.data.token;

      localStorage.setItem('facdin_token', token);
      
      if (rememberMe && res.data.remember_token) {
        localStorage.setItem('facdin_remember_token', res.data.remember_token);
      }
      
      if (res.data.usuario) {
        localStorage.setItem('facdin_user', JSON.stringify(res.data.usuario));
      }

      // Resetear intentos fallidos en login exitoso
      localStorage.removeItem('login_attempts');
      localStorage.removeItem('lock_until');
      localStorage.removeItem('last_login_attempt');
      
      navigate('/dashboard', { replace: true });
    } catch (err) {
      handleFailedAttempt();
      
      const errorMsg = err.response?.data?.error || 'Error al iniciar sesión';
      setError(errorMsg);
      
      // Efecto de vibración en error
      const form = e.target;
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError('Funcionalidad de recuperación de contraseña en desarrollo.');
  };  

  // ✅ Mostrar loading mientras verifica la autenticación
  if (!checkedAuth) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="auth-loading">
            <div className="loading-spinner large"></div>
            <p>Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Background decorativo */}
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="bg-shape shape-4"></div>
      </div>
      
      {/* Tarjeta de login principal */}
      <div className="login-card">
        {/* Header del login */}
        <div className="login-header">
          <div className="logo-container">
            <div className="app-logo">
              <span className="logo-icon">📊</span>
            </div>
            <div className="logo-text">
              <h1 className="app-name">FACDIN</h1>
              <p className="app-subtitle">Facturación Inteligente</p>
            </div>
          </div>
          
          <div className="welcome-message">
            <h2 className="welcome-title">¡Bienvenido!</h2>
            <p className="welcome-subtitle">Ingresa tus credenciales para acceder al sistema</p>
          </div>
        </div>
        
        {/* Estado de bloqueo */}
        {isLocked && (
          <div className="lock-state">
            <div className="lock-icon">🔒</div>
            <div className="lock-content">
              <h3>Cuenta temporalmente bloqueada</h3>
              <p>Demasiados intentos fallidos. Podrás intentar nuevamente en:</p>
              <div className="lock-timer">
                <span className="timer-value">{lockTime}</span>
                <span className="timer-label">segundos</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Mensaje de error */}
        {error && !isLocked && (
          <div className="login-error">
            <div className="error-header">
              <span className="error-icon">⚠️</span>
              <span className="error-title">Error de autenticación</span>
            </div>
            <p className="error-message">{error}</p>
            {loginAttempts > 0 && (
              <div className="attempts-info">
                Intentos fallidos: <strong>{loginAttempts}/5</strong>
              </div>
            )}
          </div>
        )}
        
        {/* Formulario de login */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Campo ficha */}
          <div className="input-group">
            <label htmlFor="ficha" className="input-label">
              <span className="label-icon">👤</span>
              Ficha de Usuario
            </label>
            <div className="input-wrapper">
              <input
                ref={fichaRef}
                id="ficha"
                type="text"
                placeholder="Ej: 0001"
                value={ficha}
                onChange={(e) => setFicha(e.target.value)}
                className="login-input"
                required
                disabled={loading || isLocked}
                autoComplete="username"
                maxLength="20"
              />
              {ficha && (
                <button
                  type="button"
                  className="input-clear"
                  onClick={() => setFicha('')}
                  disabled={loading || isLocked}
                  aria-label="Limpiar campo"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* Campo contraseña */}
          <div className="input-group">
            <div className="input-header">
              <label htmlFor="password" className="input-label">
                <span className="label-icon">🔒</span>
                Contraseña
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={handleForgotPassword}
                disabled={loading || isLocked}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            
            <div className="password-container">
              <div className="input-wrapper">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword || passwordVisible ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={handlePasswordChange}
                  className="login-input password-input"
                  required
                  disabled={loading || isLocked}
                  autoComplete="current-password"
                  maxLength="50"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={loading || isLocked}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              
              <div className="password-strength">
                {password.length > 0 && (
                  <>
                    <div className="strength-bar">
                      <div 
                        className={`strength-fill ${
                          password.length < 6 ? 'weak' : 
                          password.length < 10 ? 'medium' : 'strong'
                        }`}
                        style={{ width: `${Math.min(password.length * 10, 100)}%` }}
                      ></div>
                    </div>
                    <span className="strength-text">
                      {password.length < 6 ? 'Débil' : 
                       password.length < 10 ? 'Media' : 'Fuerte'}
                    </span>
                  </>
                )}
              </div>
              
              {passwordVisible && password.length > 0 && (
                <div className="password-preview">
                  <span className="preview-label">Vista previa:</span>
                  <span className="preview-text">{password}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Opciones adicionales */}
          <div className="login-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading || isLocked}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-label">Recordarme en este dispositivo</span>
            </label>
            
            {loginAttempts > 2 && (
              <div className="security-warning">
                <span className="warning-icon">⚠️</span>
                <span className="warning-text">Varios intentos fallidos detectados</span>
              </div>
            )}
          </div>
          
          {/* Botón de submit */}
          <button
            type="submit"
            className={`login-button ${loading ? 'loading' : ''} ${isLocked ? 'disabled' : ''}`}
            disabled={loading || isLocked}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Verificando credenciales...
              </>
            ) : isLocked ? (
              '🔒 Cuenta Bloqueada'
            ) : (
              <>
                <span className="button-icon">🚀</span>
                Iniciar Sesión
              </>
            )}
          </button>
        
        
        </form>
        
        
      </div>      
      
    </div>
  );
} 