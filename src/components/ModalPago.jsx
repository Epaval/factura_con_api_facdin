// src/components/ModalPago.jsx
import { useState, useMemo, useCallback } from 'react';
import './ModalPago.css';

const TIPOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo', requiereRef: false, icon: '💰' },
  { value: 'pago_movil', label: 'Pago Móvil', requiereRef: true, icon: '📱' },
  { value: 'transferencia', label: 'Transferencia', requiereRef: true, icon: '🏦' },
  { value: 'tarjeta', label: 'Tarjeta', requiereRef: true, icon: '💳' }
];

export default function ModalPago({ 
  totalFactura, 
  onPagar, 
  onCancel 
}) {
  const [formasPago, setFormasPago] = useState([
    { 
      id: Date.now(), 
      tipo: 'efectivo', 
      monto: '', 
      referencia: '',
      focusMonto: true // Para manejar autofocus
    }
  ]);
  
  const [error, setError] = useState('');

  // Calcular total pagado y vuelto usando useMemo
  const { totalPagado, vuelto, esPagoCompleto } = useMemo(() => {
    const totalPagado = formasPago.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    const vuelto = totalPagado - totalFactura;
    const esPagoCompleto = totalPagado >= totalFactura;
    
    return { totalPagado, vuelto, esPagoCompleto };
  }, [formasPago, totalFactura]);

  // Validar si el formulario es válido
  const esValido = useCallback(() => {
    if (!esPagoCompleto) return false;
    
    return formasPago.every(pago => {
      const monto = parseFloat(pago.monto);
      if (!monto || monto <= 0) return false;
      
      const tipoInfo = TIPOS_PAGO.find(t => t.value === pago.tipo);
      if (tipoInfo?.requiereRef) {
        return pago.referencia?.trim().length === 4;
      }
      return true;
    });
  }, [formasPago, esPagoCompleto]);

  const agregarFormaPago = () => {
    const nuevoPago = {
      id: Date.now(),
      tipo: 'efectivo',
      monto: '',
      referencia: '',
      focusMonto: true
    };
    
    setFormasPago(prev => [...prev, nuevoPago]);
  };

  const actualizarPago = useCallback((id, campo, valor) => {
    setFormasPago(prev => prev.map(p => 
      p.id === id ? { ...p, [campo]: valor } : p
    ));
  }, []);

  const removerPago = useCallback((id) => {
    if (formasPago.length > 1) {
      setFormasPago(prev => prev.filter(p => p.id !== id));
    }
  }, [formasPago.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!esValido()) {
      setError('Revise los montos y referencias (4 dígitos para pagos no efectivo)');
      return;
    }

    // Formatear datos para el backend
    const pagos = formasPago.map(p => ({
      tipo: p.tipo,
      monto: parseFloat(p.monto),
      referencia: p.tipo === 'efectivo' ? null : p.referencia.trim()
    }));

    onPagar(pagos, vuelto);
  };

  // Limpiar focus después de ser usado
  const handleFocusUsed = (id) => {
    setFormasPago(prev => prev.map(p => 
      p.id === id ? { ...p, focusMonto: false } : p
    ));
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onCancel();
    }}>
      <div className="modal-pago">
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="icon-title">💳</span>
            Registrar Pago
          </h2>
          <button 
            onClick={onCancel} 
            className="btn-cerrar"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="resumen-factura">
            <div className="resumen-item">
              <span>Total Factura:</span>
              <strong className="total-factura">Bs. {totalFactura.toFixed(2)}</strong>
            </div>
            
            <div className="resumen-item">
              <span>Total Pagado:</span>
              <span className={`total-pagado ${esPagoCompleto ? 'valido' : 'incompleto'}`}>
                Bs. {totalPagado.toFixed(2)}
              </span>
            </div>
            
            {vuelto > 0 && (
              <div className="resumen-item vuelto">
                <span>Vuelto:</span>
                <strong className="vuelto-monto">Bs. {vuelto.toFixed(2)}</strong>
              </div>
            )}
            
            {!esPagoCompleto && totalPagado > 0 && (
              <div className="resumen-item restante">
                <span>Falta:</span>
                <span className="restante-monto">
                  Bs. {(totalFactura - totalPagado).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message" role="alert">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-pagos">
            <div className="pagos-list">
              {formasPago.map((pago, idx) => {
                const tipoInfo = TIPOS_PAGO.find(t => t.value === pago.tipo);
                const icon = tipoInfo?.icon || '💰';
                
                return (
                  <div key={pago.id} className="forma-pago-card">
                    <div className="forma-pago-header">
                      <div className="forma-pago-titulo">
                        <span className="forma-pago-icon">{icon}</span>
                        <span className="forma-pago-numero">Forma de Pago #{idx + 1}</span>
                      </div>
                      
                      {formasPago.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removerPago(pago.id)}
                          className="btn-eliminar"
                          aria-label={`Eliminar forma de pago ${idx + 1}`}
                        >
                          <span className="eliminar-icon">🗑️</span>
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="forma-pago-grid">
                      <div className="input-group">
                        <label className="input-label">
                          <span className="label-icon">💳</span>
                          Tipo de Pago
                        </label>
                        <select
                          value={pago.tipo}
                          onChange={(e) => actualizarPago(pago.id, 'tipo', e.target.value)}
                          className="select-tipo"
                        >
                          {TIPOS_PAGO.map(t => (
                            <option key={t.value} value={t.value}>
                              {t.icon} {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label className="input-label">
                          <span className="label-icon">💰</span>
                          Monto (Bs.)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pago.monto}
                          onChange={(e) => {
                            const valor = e.target.value;
                            // Permitir máximo 2 decimales
                            if (/^\d*\.?\d{0,2}$/.test(valor)) {
                              actualizarPago(pago.id, 'monto', valor);
                            }
                          }}
                          className="input-monto"
                          required
                          autoFocus={pago.focusMonto}
                          onFocus={() => handleFocusUsed(pago.id)}
                          placeholder="0.00"
                        />
                      </div>

                      {tipoInfo?.requiereRef && (
                        <div className="input-group">
                          <label className="input-label">
                            <span className="label-icon">🔢</span>
                            Últimos 4 dígitos
                          </label>
                          <input
                            type="text"
                            maxLength="4"
                            value={pago.referencia}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              actualizarPago(pago.id, 'referencia', val);
                            }}
                            placeholder="1234"
                            className="input-ref"
                            required
                          />
                          <small className="input-hint">Solo números (4 dígitos)</small>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="acciones-pago">
              <button
                type="button"
                onClick={agregarFormaPago}
                className="btn-agregar"
              >
                <span className="agregar-icon">➕</span>
                Agregar otra forma de pago
              </button>

              <div className="acciones-botones">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!esValido()}
                  className={`btn-pagar ${esValido() ? 'activo' : 'inactivo'}`}
                >
                  <span className="pagar-icon">✅</span>
                  Registrar Pago
                  <span className="total-info">(Bs. {totalPagado.toFixed(2)})</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
