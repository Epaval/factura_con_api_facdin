import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import './CajaControl.css';

export default function CajaControl() {
  const [cajas, setCajas] = useState({
    caja1: {
      id: '001',
      estado: 'cerrada',
      impresora: 'EPSON-CAJA-001',
      nombre: 'Caja Principal',
      usuario: null
    },
    caja2: {
      id: '002',
      estado: 'cerrada',
      impresora: 'EPSON-CAJA-002',
      nombre: 'Caja Secundaria',
      usuario: null
    },
    caja3: {
      id: '003',
      estado: 'cerrada',
      impresora: 'EPSON-CAJA-003',
      nombre: 'Caja Especial',
      usuario: null
    }
  });

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState('');
  const [selectedCaja, setSelectedCaja] = useState('');
  const [notification, setNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState('Usuario Actual');
  const socketRef = useRef(null);

  // Inicializar WebSocket
  useEffect(() => {
    // Obtener nombre de usuario actual
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    setCurrentUser(userData.name || 'Usuario Actual');

    // Conectar al WebSocket
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}`);
      
      socket.onopen = () => {
        console.log('🟢 Conectado al servidor WebSocket');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'estado-cajas') {
            // Actualizar estado de todas las cajas
            setCajas(prev => {
              const nuevasCajas = { ...prev };
              Object.keys(data.payload).forEach(cajaKey => {
                if (nuevasCajas[cajaKey]) {
                  nuevasCajas[cajaKey] = {
                    ...nuevasCajas[cajaKey],
                    estado: data.payload[cajaKey].estado,
                    usuario: data.payload[cajaKey].usuario
                  };
                }
              });
              return nuevasCajas;
            });
          }
        } catch (error) {
          console.error('Error al procesar mensaje WebSocket:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('🔴 Error de WebSocket:', error);
      };

      socket.onclose = () => {
        console.log('🟡 Desconectado del servidor WebSocket');
        // Intentar reconectar después de 3 segundos
        setTimeout(connectWebSocket, 3000);
      };

      socketRef.current = socket;
    };

    connectWebSocket();

    // Limpiar conexión al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  // Obtener cajas filtradas según el estado
  const getCajasFiltradas = () => {
    const cajasArray = Object.entries(cajas);
    
    // Si hay una caja abierta, mostrar solo esa
    const cajaAbierta = cajasArray.find(([key, caja]) => caja.estado === 'abierta');
    if (cajaAbierta) {
      return [cajaAbierta];
    }
    
    // Si no hay cajas abiertas, mostrar solo las cerradas
    return cajasArray.filter(([key, caja]) => caja.estado === 'cerrada');
  };

  const abrirCaja = async () => {
    setLoading(true);
    try {
      const caja = cajas[selectedCaja];
      
      await api.post(
        '/caja/abrir',
        { 
          cajaId: caja.id, 
          impresoraFiscal: caja.impresora,
          nombre: caja.nombre
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('facdin_token')}` }
        }
      );

      showNotification('success', '✅ Operación Exitosa', `Caja ${caja.nombre} abierta exitosamente`);
      
    } catch (err) {
      showNotification('error', '❌ Error', 'Error al abrir caja: ' + (err.response?.data?.error || 'Error desconocido'));
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setSelectedCaja('');
      setActionType('');
    }
  };

  const cerrarCaja = async () => {
    setLoading(true);
    try {
      const caja = cajas[selectedCaja];
      
      await api.post(
        '/caja/cerrar',
        { cajaId: caja.id },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('facdin_token')}` }
        }
      );

      showNotification('success', '✅ Operación Exitosa', `Caja ${caja.nombre} cerrada exitosamente`);
      
    } catch (err) {
      showNotification('error', '❌ Error', 'Error al cerrar caja');
    } finally {
      setLoading(false);
      setShowConfirm(false);
      setSelectedCaja('');
      setActionType('');
    }
  };

  const handleActionClick = (type, cajaKey) => {
    // Verificar si hay una caja abierta por otro usuario
    const cajaAbierta = Object.values(cajas).find(c => c.estado === 'abierta');
    if (type === 'abrir' && cajaAbierta && cajaAbierta.usuario !== currentUser) {
      showNotification('error', '❌ Acción Denegada', 
        `No se puede abrir la ${cajas[cajaKey].nombre} porque la ${cajaAbierta.nombre} ya está abierta por ${cajaAbierta.usuario}. Solo puede haber una caja abierta a la vez.`);
      return;
    }

    setActionType(type);
    setSelectedCaja(cajaKey);
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
    setSelectedCaja('');
  };

  // Obtener cajas filtradas para mostrar
  const cajasFiltradas = getCajasFiltradas();

  return (
    <div className="caja-container">
      <h2 className="caja-title">Control de Cajas</h2>
      
      {/* Mensaje informativo */}
      <div className="cajas-info">
        {cajasFiltradas.some(([key, caja]) => caja.estado === 'abierta') ? (
          <p>
            Hay una caja abierta por {cajasFiltradas.find(([key, caja]) => caja.estado === 'abierta')?.[1].usuario || 'otro usuario'}. 
            Solo se muestra la caja activa.
          </p>
        ) : (
          <p>Seleccione una caja para abrir. Solo se muestran cajas cerradas.</p>
        )}
      </div>
      
      <div className="cajas-grid">
        {cajasFiltradas.map(([cajaKey, caja]) => (
          <div key={cajaKey} className={`caja-status-card ${caja.estado}`}>
            <div className="caja-header">
              <h3 className="caja-nombre">{caja.nombre}</h3>
              <div className="status-header">
                <div className="status-indicator">
                  <span className={`status-dot ${caja.estado}`}></span>
                  <span className="status-text">Estado:</span>
                </div>
                <span className={`status-badge ${caja.estado}`}>
                  {caja.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
            </div>

            {caja.usuario && caja.estado === 'abierta' && (
              <div className="caja-usuario-info">
                <span>Usuario: {caja.usuario}</span>
              </div>
            )}

            <div className="caja-info">
              <div className="info-item">
                <span className="info-label">ID de Caja:</span>
                <span className="info-value">{caja.id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Impresora Fiscal:</span>
                <span className="info-value">{caja.impresora}</span>
              </div>
            </div>

            <div className="action-buttons">
              {caja.estado === 'cerrada' ? (
                <button 
                  onClick={() => handleActionClick('abrir', cajaKey)}
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
                  onClick={() => handleActionClick('cerrar', cajaKey)}
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
        ))}
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
                ? `¿Está seguro de que desea abrir la ${cajas[selectedCaja]?.nombre}? Esta acción permitirá comenzar a facturar.`
                : `¿Está seguro de que desea cerrar la ${cajas[selectedCaja]?.nombre}? No podrá facturar hasta que la abra nuevamente.`
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

      {/* Modal de notificación */}
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
    </div>
  );
}