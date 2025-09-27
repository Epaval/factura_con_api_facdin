import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './CajaControl.css'; // Asegúrate de importar tu archivo CSS

export default function CajaControl() {
  const [estado, setEstado] = useState('cerrada');
  const [cajaId, setCajaId] = useState('002');
  const [impresora, setImpresora] = useState('EPSON-PRUEBA-002345');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState('');
  const [notification, setNotification] = useState(null);
  const [toast, setToast] = useState(null);

  // Opción 1: Usar modal de notificación
  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  // Opción 2: Usar toast notification (se cierra automáticamente)
  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    
    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const hideToast = () => {
    setToast(null);
  };

  const abrirCaja = async () => {
    setLoading(true);
    try {
      await api.post(
        '/caja/abrir',
        { cajaId, impresoraFiscal: impresora },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('facdin_token')}` }
        }
      );
      setEstado('abierta');
      
      // Opción 1: Modal de notificación
      showNotification('success', '✅ Operación Exitosa', 'Caja abierta exitosamente');
      
      // Opción 2: Toast notification (descomenta la línea siguiente y comenta la anterior)
      // showToast('success', 'Caja Abierta', 'La caja ha sido abierta exitosamente');
      
    } catch (err) {
      // Opción 1: Modal de notificación
      showNotification('error', '❌ Error', 'Error al abrir caja: ' + (err.response?.data?.error || 'Error desconocido'));
      
      // Opción 2: Toast notification
      // showToast('error', 'Error', 'No se pudo abrir la caja');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const cerrarCaja = async () => {
    setLoading(true);
    try {
      await api.post(
        '/caja/cerrar',
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('facdin_token')}` }
        }
      );
      setEstado('cerrada');
      
      // Opción 1: Modal de notificación
      showNotification('success', '✅ Operación Exitosa', 'Caja cerrada exitosamente');
      
      // Opción 2: Toast notification
      // showToast('success', 'Caja Cerrada', 'La caja ha sido cerrada exitosamente');
      
    } catch (err) {
      // Opción 1: Modal de notificación
      showNotification('error', '❌ Error', 'Error al cerrar caja');
      
      // Opción 2: Toast notification
      // showToast('error', 'Error', 'No se pudo cerrar la caja');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleActionClick = (type) => {
    setActionType(type);
    setShowConfirm(true);
  };

  const confirmAction = () => {
    if (actionType === 'abrir') {
      abrirCaja();
    } else {
      cerrarCaja();
    }
  };

  const cancelAction = () => {
    setShowConfirm(false);
    setActionType('');
  };

  // Cerrar toast con ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.keyCode === 27) {
        hideNotification();
        hideToast();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, []);

  return (
    <div className="caja-container">
      <h2 className="caja-title">Control de Caja</h2>
      
      <div className="caja-status-card">
        <div className="status-header">
          <div className="status-indicator">
            <span className={`status-dot ${estado}`}></span>
            <span className="status-text">Estado de la Caja:</span>
          </div>
          <span className={`status-badge ${estado}`}>
            {estado === 'abierta' ? 'Abierta' : 'Cerrada'}
          </span>
        </div>

        <div className="caja-info">
          <div className="info-item">
            <span className="info-label">ID de Caja:</span>
            <span className="info-value">{cajaId}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Impresora Fiscal:</span>
            <span className="info-value">{impresora}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Última acción:</span>
            <span className="info-value">
              {estado === 'abierta' ? 'Caja abierta' : 'Caja cerrada'}
            </span>
          </div>
        </div>

        <div className="action-buttons">
          {estado === 'cerrada' ? (
            <button 
              onClick={() => handleActionClick('abrir')}
              className={`caja-button abrir ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          ) : (
            <button 
              onClick={() => handleActionClick('cerrar')}
              className={`caja-button cerrar ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {loading ? 'Cerrando...' : 'Cerrar Caja'}
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">
              Confirmar {actionType === 'abrir' ? 'Apertura' : 'Cierre'} de Caja
            </h3>
            <p className="modal-message">
              {actionType === 'abrir' 
                ? '¿Está seguro de que desea abrir la caja? Esta acción permitirá comenzar a facturar.'
                : '¿Está seguro de que desea cerrar la caja? No podrá facturar hasta que la abra nuevamente.'
              }
            </p>
            <div className="modal-actions">
              <button 
                onClick={cancelAction}
                className="modal-button cancel"
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmAction}
                className={`modal-button confirm ${actionType}`}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opción 1: Modal de notificación */}
      {notification && (
        <div className="notification-overlay">
          <div className={`notification-modal ${notification.type}`}>
            <div className="notification-icon bounce">
              {notification.type === 'success' ? '✅' : '❌'}
            </div>
            <h3 className="notification-title">{notification.title}</h3>
            <p className="notification-message">{notification.message}</p>
            <button 
              onClick={hideNotification}
              className={`notification-button ${notification.type}`}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Opción 2: Toast notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? '✅' : '❌'}
          </div>
          <div className="toast-content">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button 
            onClick={hideToast}
            className="toast-close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}