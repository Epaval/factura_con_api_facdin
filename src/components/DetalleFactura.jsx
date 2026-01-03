 // src/components/DetalleFactura.jsx
import { useEffect, useState, useMemo } from 'react';
import './DetalleFactura.css';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerDetalleFactura } from '../services/facturasApi';
import { obtenerPagoPorFactura } from '../services/pagosLocalDB';

// ✅ Función mejorada para formatear fecha
const formatearFecha = (fechaStr) => {
  if (!fechaStr || fechaStr === 'N/A' || fechaStr.trim() === '') {
    return 'N/A';
  }

  try {
    // Si ya está en formato DD/MM/YYYY, retornar tal cual
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
      return fechaStr;
    }

    // Manejar formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      const [year, month, day] = fechaStr.split('-');
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    // Manejar formato ISO (YYYY-MM-DDTHH:mm:ss...)
    if (fechaStr.includes('T')) {
      const date = new Date(fechaStr);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }

    // Si es una fecha válida pero en otro formato
    const date = new Date(fechaStr);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return fechaStr; // Retornar original si no se puede parsear
  } catch (error) {
    console.warn('Error al formatear fecha:', fechaStr, error);
    return fechaStr; // Retornar original en caso de error
  }
};

// ✅ Función mejorada para convertir a número
const toNumber = (valor) => {
  if (valor == null) return 0;
  
  if (typeof valor === 'number') {
    return isNaN(valor) ? 0 : valor;
  }
  
  if (typeof valor === 'string') {
    // Eliminar caracteres no numéricos excepto punto decimal
    const cleaned = valor.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  // Intentar convertir otros tipos
  const num = Number(valor);
  return isNaN(num) ? 0 : num;
};

// ✅ Mapeo de tipos de pago a iconos y etiquetas
const TIPO_PAGO_CONFIG = {
  efectivo: { icon: '💵', label: 'Efectivo', color: '#27ae60' },
  pago_movil: { icon: '📱', label: 'Pago Móvil', color: '#3498db' },
  transferencia: { icon: '🏦', label: 'Transferencia', color: '#9b59b6' },
  tarjeta: { icon: '💳', label: 'Tarjeta', color: '#e74c3c' }
};

export default function DetalleFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [pagosLocales, setPagosLocales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const cargarDetalle = async () => {
      if (!id) {
        setLoading(false);
        setError('ID de factura no proporcionado');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await obtenerDetalleFactura(id);
        setFactura(data);
        
        // ✅ Cargar pagos locales si existe el número de factura
        if (data.numero_factura) {
          try {
            const pagoLocal = await obtenerPagoPorFactura(data.numero_factura);
            setPagosLocales(pagoLocal);
          } catch (pagoError) {
            console.warn('No se pudieron cargar los pagos locales:', pagoError);
            // No marcamos error porque los pagos locales son opcionales
          }
        }
      } catch (err) {
        console.error('Error al cargar detalle:', err);
        
        // Intentar nuevamente hasta 3 veces
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1));
        } else {
          setError('No se pudo cargar la factura. Por favor, intente nuevamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    cargarDetalle();
  }, [id, retryCount]);

  // ✅ Calcular total de detalles usando useMemo
  const totalDetalles = useMemo(() => {
    if (!factura?.detalles) return 0;
    return factura.detalles.reduce((sum, detalle) => {
      const cantidad = toNumber(detalle.cantidad);
      const precio = toNumber(detalle.precio_unitario);
      return sum + (cantidad * precio);
    }, 0);
  }, [factura]);

  // ✅ Determinar estado de la factura
  const estadoFactura = useMemo(() => {
    if (!factura) return 'desconocido';
    
    // Si hay pagos locales, está pagada
    if (pagosLocales) return 'pagada';
    
    // Podrías tener otros criterios aquí según tu API
    return factura.estado || 'pendiente';
  }, [factura, pagosLocales]);

  const handleVolver = () => {
    navigate('/facturas');
  };

  const handleReintentar = () => {
    setRetryCount(0);
  };

  if (loading) {
    return (
      <div className="detalle-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Cargando detalles de la factura...</p>
          {retryCount > 0 && <p className="loading-retry">Reintento {retryCount}/3</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detalle-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar la factura</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleReintentar} className="btn-reintentar">
              Reintentar
            </button>
            <button onClick={handleVolver} className="btn-volver">
              ← Volver a facturas
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="detalle-container">
        <div className="not-found-state">
          <div className="not-found-icon">🔍</div>
          <h3>Factura no encontrada</h3>
          <p>La factura solicitada no existe o fue eliminada.</p>
          <button onClick={handleVolver} className="btn-volver">
            ← Volver a facturas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detalle-container">
      {/* Header con botón de volver */}
      <header className="detalle-header">
        <button onClick={handleVolver} className="btn-volver-detalle">
          <span className="btn-volver-icon">←</span>
          <span className="btn-volver-text">Volver a facturas</span>
        </button>
        
        <div className="header-actions">
          <span className={`estado-badge estado-${estadoFactura}`}>
            {estadoFactura === 'pagada' ? '✅ Pagada' : 
             estadoFactura === 'pendiente' ? '⏳ Pendiente' : '❓ Desconocido'}
          </span>
          
          <button 
            onClick={() => window.print()} 
            className="btn-imprimir"
            aria-label="Imprimir factura"
          >
            🖨️ Imprimir
          </button>
        </div>
      </header>

      {/* Tarjeta principal de la factura */}
      <main className="factura-card">
        {/* Cabecera de la factura */}
        <div className="cabecera-factura">
          <div className="cabecera-principal">
            <div className="factura-titulo">
              <h1 className="factura-numero">
                <span className="factura-icon">📄</span>
                Factura N° {factura.numero_factura || factura.id || 'N/A'}
              </h1>
              <p className="factura-fecha">
                <span className="fecha-icon">📅</span>
                Fecha: {formatearFecha(factura.fecha)}
              </p>
            </div>
            
            <div className="factura-qr">
              <div className="qr-placeholder">
                <span className="qr-icon">🔳</span>
                <small>Código QR</small>
              </div>
            </div>
          </div>
        </div>

        {/* Información del cliente */}
        <section className="seccion seccion-cliente">
          <div className="seccion-header">
            <h2 className="seccion-titulo">
              <span className="seccion-icon">👤</span>
              Información del Cliente
            </h2>
          </div>
          
          <div className="cliente-info-grid">
            <div className="info-item">
              <span className="info-label">RIF/CI:</span>
              <span className="info-value">{factura.rif_receptor || 'No especificado'}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Nombre/Razón Social:</span>
              <span className="info-value destacado">
                {factura.razon_social_receptor || 'Cliente no registrado'}
              </span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Dirección:</span>
              <span className="info-value">{factura.direccion_receptor || 'No especificada'}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Teléfono:</span>
              <span className="info-value">{factura.telefono_receptor || 'No especificado'}</span>
            </div>
          </div>
        </section>

        {/* Detalles de los productos/servicios */}
        <section className="seccion seccion-detalles">
          <div className="seccion-header">
            <h2 className="seccion-titulo">
              <span className="seccion-icon">📋</span>
              Detalles de la Factura
            </h2>
            <span className="items-count">{factura.detalles?.length || 0} items</span>
          </div>
          
          <div className="tabla-container">
            <table className="tabla-detalles">
              <thead>
                <tr>
                  <th className="col-descripcion">Descripción</th>
                  <th className="col-cantidad">Cantidad</th>
                  <th className="col-precio">Precio Unitario</th>
                  <th className="col-total">Total</th>
                </tr>
              </thead>
              <tbody>
                {factura.detalles?.map((detalle, index) => {
                  const cantidad = toNumber(detalle.cantidad);
                  const precioUnitario = toNumber(detalle.precio_unitario);
                  const totalLinea = cantidad * precioUnitario;
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'fila-par' : 'fila-impar'}>
                      <td className="col-descripcion">
                        <span className="descripcion-texto">{detalle.descripcion || 'Producto no especificado'}</span>
                        {detalle.codigo && (
                          <small className="codigo-producto">Código: {detalle.codigo}</small>
                        )}
                      </td>
                      <td className="col-cantidad">
                        <span className="cantidad-badge">{cantidad.toFixed(2)}</span>
                      </td>
                      <td className="col-precio">Bs. {precioUnitario.toFixed(2)}</td>
                      <td className="col-total">
                        <strong>Bs. {totalLinea.toFixed(2)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {(!factura.detalles || factura.detalles.length === 0) && (
            <div className="sin-detalles">
              <span className="sin-detalles-icon">📭</span>
              <p>No hay detalles disponibles para esta factura</p>
            </div>
          )}
        </section>

        {/* Resumen financiero */}
        <section className="seccion seccion-resumen">
          <div className="seccion-header">
            <h2 className="seccion-titulo">
              <span className="seccion-icon">💰</span>
              Resumen Financiero
            </h2>
          </div>
          
          <div className="resumen-grid">
            <div className="resumen-columna">
              <div className="resumen-item">
                <span className="resumen-label">Subtotal:</span>
                <span className="resumen-valor">
                  Bs. {toNumber(factura.subtotal || totalDetalles).toFixed(2)}
                </span>
              </div>
              
              <div className="resumen-item">
                <span className="resumen-label">IVA (16%):</span>
                <span className="resumen-valor iva">
                  Bs. {toNumber(factura.iva).toFixed(2)}
                </span>
              </div>
              
              <div className="resumen-item">
                <span className="resumen-label">Descuentos:</span>
                <span className="resumen-valor descuento">
                  Bs. {toNumber(factura.descuento || 0).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="resumen-columna total-columna">
              <div className="resumen-item total">
                <span className="resumen-label">TOTAL FACTURA:</span>
                <span className="resumen-valor total-monto">
                  Bs. {toNumber(factura.total).toFixed(2)}
                </span>
              </div>
              
              {pagosLocales && pagosLocales.vuelto > 0 && (
                <div className="resumen-item vuelto">
                  <span className="resumen-label">Vuelto Entregado:</span>
                  <span className="resumen-valor vuelto-monto">
                    Bs. {pagosLocales.vuelto.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sección de pagos (si existen) */}
        {pagosLocales && (
          <section className="seccion seccion-pagos">
            <div className="seccion-header">
              <h2 className="seccion-titulo">
                <span className="seccion-icon">💳</span>
                Métodos de Pago
              </h2>
              <span className="pagos-count">{pagosLocales.pagos.length} pagos</span>
            </div>
            
            <div className="pagos-grid">
              {pagosLocales.pagos.map((pago, index) => {
                const config = TIPO_PAGO_CONFIG[pago.tipo] || TIPO_PAGO_CONFIG.efectivo;
                const estiloPago = {
                  '--pago-color': config.color
                };
                
                return (
                  <div 
                    key={index} 
                    className="pago-card"
                    style={estiloPago}
                  >
                    <div className="pago-header">
                      <span className="pago-icon">{config.icon}</span>
                      <span className="pago-tipo">{config.label}</span>
                      <span className="pago-indice">#{index + 1}</span>
                    </div>
                    
                    <div className="pago-cuerpo">
                      <div className="pago-monto">
                        <span className="monto-label">Monto:</span>
                        <span className="monto-valor">Bs. {parseFloat(pago.monto).toFixed(2)}</span>
                      </div>
                      
                      {pago.referencia && (
                        <div className="pago-referencia">
                          <span className="referencia-label">Referencia:</span>
                          <span className="referencia-valor">{pago.referencia}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pago-fecha">
                      <small>{formatearFecha(pagosLocales.fecha_pago)}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Información adicional */}
        <section className="seccion seccion-adicional">
          <div className="seccion-header">
            <h3 className="seccion-titulo">
              <span className="seccion-icon">📝</span>
              Información Adicional
            </h3>
          </div>
          
          <div className="info-adicional">
            {factura.observaciones && (
              <div className="adicional-item">
                <span className="adicional-label">Observaciones:</span>
                <p className="adicional-valor">{factura.observaciones}</p>
              </div>
            )}
            
            <div className="adicional-item">
              <span className="adicional-label">Fecha de Emisión:</span>
              <span className="adicional-valor">{formatearFecha(factura.fecha)}</span>
            </div>
            
            {factura.fecha_vencimiento && (
              <div className="adicional-item">
                <span className="adicional-label">Fecha de Vencimiento:</span>
                <span className="adicional-valor vencimiento">
                  {formatearFecha(factura.fecha_vencimiento)}
                </span>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer con acciones */}
      <footer className="detalle-footer">
        <div className="footer-info">
          <small>ID Interno: {factura.id}</small>
          <small>Última actualización: {formatearFecha(factura.updated_at)}</small>
        </div>
        
        <div className="footer-actions">
          <button 
            onClick={() => navigate(`/facturas/editar/${id}`)} 
            className="btn-editar"
            disabled={pagosLocales} // No editar si ya está pagada
          >
            ✏️ {pagosLocales ? 'Factura Pagada' : 'Editar Factura'}
          </button>
          
          <button 
            onClick={() => navigate(`/facturas/pagar/${id}`)} 
            className="btn-pagar"
            disabled={pagosLocales}
          >
            💳 {pagosLocales ? 'Ya Pagada' : 'Registrar Pago'}
          </button>
        </div>
      </footer>
    </div>
  );
}