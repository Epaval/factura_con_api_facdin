 // src/components/ReporteDiario.jsx
import { useState, useEffect, useMemo } from 'react';
import { obtenerReporteDiario } from '../services/reportesLocalDB';
import './ReporteDiario.css';

// ✅ Configuración de métodos de pago
const METODOS_PAGO = {
  efectivo: { 
    icon: '💵', 
    label: 'Efectivo', 
    color: '#27ae60',
    bgColor: 'rgba(39, 174, 96, 0.1)'
  },
  pago_movil: { 
    icon: '📱', 
    label: 'Pago Móvil', 
    color: '#3498db',
    bgColor: 'rgba(52, 152, 219, 0.1)'
  },
  transferencia: { 
    icon: '🏦', 
    label: 'Transferencia', 
    color: '#9b59b6',
    bgColor: 'rgba(155, 89, 182, 0.1)'
  },
  tarjeta: { 
    icon: '💳', 
    label: 'Tarjeta', 
    color: '#e74c3c',
    bgColor: 'rgba(231, 76, 60, 0.1)'
  }
};

// ✅ Helper para formato de moneda
const formatoMoneda = (monto) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2
  }).format(monto || 0);
};

// ✅ Helper para fecha legible
const formatearFecha = (fechaISO) => {
  if (!fechaISO) return '';
  
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ✅ Helper para obtener día de la semana
const obtenerDiaSemana = (fechaISO) => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const fecha = new Date(fechaISO);
  return dias[fecha.getDay()];
};

export default function ReporteDiario() {
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(false);

  // ✅ Estadísticas calculadas
  const estadisticas = useMemo(() => {
    if (!reporte) return null;
    
    const totalFacturas = reporte.facturas.length;
    const totalVuelto = reporte.facturas.reduce((sum, f) => sum + (f.vuelto || 0), 0);
    const totalTransacciones = Object.values(reporte.porMetodo).reduce(
      (sum, metodo) => sum + (metodo.cantidad || 0), 0
    );
    
    // Método más usado
    const metodoMasUsado = Object.entries(reporte.porMetodo).reduce(
      (max, [tipo, datos]) => datos.cantidad > (max?.cantidad || 0) ? { tipo, ...datos } : max,
      null
    );
    
    // Factura con mayor monto
    const facturaMayor = reporte.facturas.reduce(
      (max, factura) => {
        const total = factura.pagos.reduce((sum, p) => sum + (p.monto || 0), 0);
        return total > max.monto ? { numero: factura.numeroFactura, monto: total } : max;
      },
      { numero: '', monto: 0 }
    );
    
    return {
      totalFacturas,
      totalVuelto,
      totalTransacciones,
      metodoMasUsado,
      facturaMayor,
      promedioFactura: totalFacturas > 0 ? reporte.totalGeneral / totalFacturas : 0
    };
  }, [reporte]);

  // ✅ Cargar reporte
  const cargarReporte = async (fechaEspecifica = fecha) => {
    if (!fechaEspecifica) return;
    
    setLoading(true);
    setError('');
    try {
      const data = await obtenerReporteDiario(fechaEspecifica);
      setReporte(data);
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      setError('No se pudo cargar el reporte. Verifique su conexión o intente nuevamente.');
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReporte();
  }, []);

  const handleFechaChange = (e) => {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);
    cargarReporte(nuevaFecha);
  };

  const handleFechaAnterior = () => {
    const fechaActual = new Date(fecha);
    fechaActual.setDate(fechaActual.getDate() - 1);
    const nuevaFecha = fechaActual.toISOString().split('T')[0];
    setFecha(nuevaFecha);
    cargarReporte(nuevaFecha);
  };

  const handleFechaSiguiente = () => {
    const fechaActual = new Date(fecha);
    fechaActual.setDate(fechaActual.getDate() + 1);
    const nuevaFecha = fechaActual.toISOString().split('T')[0];
    setFecha(nuevaFecha);
    cargarReporte(nuevaFecha);
  };

  const handleHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setFecha(hoy);
    cargarReporte(hoy);
  };

  const exportarReporte = () => {
    if (!reporte) return;
    
    setExportando(true);
    try {
      // Crear contenido CSV
      let csvContent = 'Reporte Diario - ' + formatearFecha(fecha) + '\n\n';
      
      // Métodos de pago
      csvContent += 'Método de Pago,Cantidad,Total\n';
      Object.entries(reporte.porMetodo).forEach(([tipo, datos]) => {
        const metodo = METODOS_PAGO[tipo]?.label || tipo;
        csvContent += `${metodo},${datos.cantidad},${datos.total}\n`;
      });
      
      csvContent += `\nTotal General,,${reporte.totalGeneral}\n\n`;
      
      // Facturas detalladas
      csvContent += 'N° Factura,Total,Vuelto,Métodos de Pago\n';
      reporte.facturas.forEach(factura => {
        const total = factura.pagos.reduce((sum, p) => sum + p.monto, 0);
        const metodos = factura.pagos.map(p => 
          `${METODOS_PAGO[p.tipo]?.label || p.tipo}: ${p.monto}${p.referencia ? ` (Ref: ${p.referencia})` : ''}`
        ).join('; ');
        
        csvContent += `${factura.numeroFactura},${total},${factura.vuelto || 0},"${metodos}"\n`;
      });
      
      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_diario_${fecha}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => setExportando(false), 1500);
    } catch (err) {
      console.error('Error al exportar:', err);
      setError('Error al exportar el reporte');
      setExportando(false);
    }
  };

  const imprimirReporte = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="reporte-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Generando reporte diario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reporte-container">
      {/* Header con título y navegación */}
      <header className="reporte-header">
        <div className="header-titulo">
          <h1 className="titulo-principal">
            <span className="titulo-icono">📊</span>
            Reporte Diario de Ventas
          </h1>
          <p className="subtitulo">
            Análisis detallado de transacciones por día
          </p>
        </div>
        
        <div className="header-acciones">
          <button 
            onClick={handleHoy}
            className="btn-hoy"
          >
            <span className="btn-icono">📅</span>
            Hoy
          </button>
          
          <button 
            onClick={exportarReporte}
            disabled={!reporte || exportando}
            className="btn-exportar"
          >
            <span className="btn-icono">
              {exportando ? '⏳' : '📥'}
            </span>
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </button>
          
          <button 
            onClick={imprimirReporte}
            disabled={!reporte}
            className="btn-imprimir"
          >
            <span className="btn-icono">🖨️</span>
            Imprimir
          </button>
        </div>
      </header>

      {/* Panel de navegación por fechas */}
      <div className="panel-navegacion">
        <div className="navegacion-fechas">
          <button 
            onClick={handleFechaAnterior}
            className="btn-navegacion btn-anterior"
            aria-label="Día anterior"
          >
            <span className="navegacion-icono">←</span>
            Anterior
          </button>
          
          <div className="selector-fecha">
            <label className="fecha-label">
              <span className="label-icono">📅</span>
              Seleccionar fecha:
            </label>
            <input
              type="date"
              value={fecha}
              onChange={handleFechaChange}
              className="input-fecha"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <button 
            onClick={handleFechaSiguiente}
            disabled={fecha >= new Date().toISOString().split('T')[0]}
            className="btn-navegacion btn-siguiente"
            aria-label="Día siguiente"
          >
            Siguiente
            <span className="navegacion-icono">→</span>
          </button>
        </div>
        
        <div className="fecha-actual">
          <span className="fecha-dia">{obtenerDiaSemana(fecha)}</span>
          <span className="fecha-fecha">{formatearFecha(fecha)}</span>
        </div>
      </div>

      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar el reporte</h3>
          <p>{error}</p>
          <button 
            onClick={() => cargarReporte()} 
            className="btn-reintentar"
          >
            Reintentar
          </button>
        </div>
      )}

      {reporte ? (
        <div className="contenido-reporte">
          {reporte.facturas.length === 0 ? (
            <div className="sin-ventas">
              <div className="sin-ventas-icono">📭</div>
              <h3>No hay ventas registradas para esta fecha</h3>
              <p>No se encontraron transacciones para el día seleccionado.</p>
            </div>
          ) : (
            <>
              {/* Resumen general */}
              <section className="seccion seccion-resumen">
                <div className="seccion-header">
                  <h2 className="seccion-titulo">
                    <span className="seccion-icono">💰</span>
                    Resumen del Día
                  </h2>
                  <div className="seccion-subtitulo">
                    {estadisticas.totalFacturas} facturas · {estadisticas.totalTransacciones} transacciones
                  </div>
                </div>
                
                <div className="resumen-grid">
                  <div className="resumen-card total-card">
                    <div className="resumen-icono">💼</div>
                    <div className="resumen-contenido">
                      <span className="resumen-label">Total del Día</span>
                      <span className="resumen-valor total">
                        {formatoMoneda(reporte.totalGeneral)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="resumen-card">
                    <div className="resumen-icono">📄</div>
                    <div className="resumen-contenido">
                      <span className="resumen-label">Total Facturas</span>
                      <span className="resumen-valor">
                        {estadisticas.totalFacturas}
                      </span>
                      <small className="resumen-hint">
                        {formatoMoneda(estadisticas.promedioFactura)} promedio
                      </small>
                    </div>
                  </div>
                  
                  <div className="resumen-card">
                    <div className="resumen-icono">💸</div>
                    <div className="resumen-contenido">
                      <span className="resumen-label">Total Vuelto</span>
                      <span className="resumen-valor vuelto">
                        {formatoMoneda(estadisticas.totalVuelto)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="resumen-card">
                    <div className="resumen-icono">📊</div>
                    <div className="resumen-contenido">
                      <span className="resumen-label">Método Más Usado</span>
                      <span className="resumen-valor metodo">
                        {estadisticas.metodoMasUsado ? 
                          `${METODOS_PAGO[estadisticas.metodoMasUsado.tipo]?.icon} ${METODOS_PAGO[estadisticas.metodoMasUsado.tipo]?.label}` : 
                          'N/A'}
                      </span>
                      <small className="resumen-hint">
                        {estadisticas.metodoMasUsado?.cantidad} transacciones
                      </small>
                    </div>
                  </div>
                </div>
              </section>

              {/* Métodos de pago */}
              <section className="seccion seccion-metodos">
                <div className="seccion-header">
                  <h2 className="seccion-titulo">
                    <span className="seccion-icono">💳</span>
                    Distribución por Método de Pago
                  </h2>
                </div>
                
                <div className="metodos-grid">
                  {Object.entries(reporte.porMetodo)
                    .sort(([,a], [,b]) => b.total - a.total)
                    .map(([tipo, datos]) => {
                      const metodo = METODOS_PAGO[tipo] || METODOS_PAGO.efectivo;
                      const porcentaje = reporte.totalGeneral > 0 ? 
                        ((datos.total / reporte.totalGeneral) * 100).toFixed(1) : 0;
                      
                      return (
                        <div 
                          key={tipo} 
                          className="metodo-card"
                          style={{ 
                            '--metodo-color': metodo.color,
                            '--metodo-bg': metodo.bgColor
                          }}
                        >
                          <div className="metodo-header">
                            <span className="metodo-icono">{metodo.icon}</span>
                            <span className="metodo-nombre">{metodo.label}</span>
                            <span className="metodo-porcentaje">{porcentaje}%</span>
                          </div>
                          
                          <div className="metodo-bar">
                            <div 
                              className="metodo-bar-fill"
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                          
                          <div className="metodo-datos">
                            <div className="metodo-monto">
                              <span className="monto-label">Total:</span>
                              <span className="monto-valor">{formatoMoneda(datos.total)}</span>
                            </div>
                            
                            <div className="metodo-cantidad">
                              <span className="cantidad-label">Transacciones:</span>
                              <span className="cantidad-valor">{datos.cantidad}</span>
                            </div>
                            
                            {datos.cantidad > 0 && (
                              <div className="metodo-promedio">
                                <span className="promedio-label">Promedio:</span>
                                <span className="promedio-valor">
                                  {formatoMoneda(datos.total / datos.cantidad)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>

              {/* Lista de facturas */}
              <section className="seccion seccion-facturas">
                <div className="seccion-header">
                  <h2 className="seccion-titulo">
                    <span className="seccion-icono">📋</span>
                    Facturas del Día
                    <span className="facturas-count">({reporte.facturas.length})</span>
                  </h2>
                </div>
                
                <div className="tabla-container">
                  <table className="tabla-facturas">
                    <thead>
                      <tr>
                        <th className="col-numero">N° Factura</th>
                        <th className="col-metodos">Métodos de Pago</th>
                        <th className="col-total">Total Factura</th>
                        <th className="col-vuelto">Vuelto</th>
                        <th className="col-acciones">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporte.facturas.map((factura, index) => {
                        const totalFactura = factura.pagos.reduce(
                          (sum, p) => sum + (parseFloat(p.monto) || 0), 0
                        );
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'fila-par' : 'fila-impar'}>
                            <td className="col-numero">
                              <div className="factura-numero">
                                <span className="numero-prefijo">#</span>
                                {factura.numeroFactura}
                              </div>
                            </td>
                            
                            <td className="col-metodos">
                              <div className="pagos-lista">
                                {factura.pagos.map((pago, idx) => {
                                  const metodo = METODOS_PAGO[pago.tipo] || METODOS_PAGO.efectivo;
                                  
                                  return (
                                    <div key={idx} className="pago-item">
                                      <span 
                                        className="pago-icono"
                                        style={{ color: metodo.color }}
                                      >
                                        {metodo.icon}
                                      </span>
                                      <span className="pago-info">
                                        <span className="pago-tipo">{metodo.label}</span>
                                        <span className="pago-monto">{formatoMoneda(pago.monto)}</span>
                                        {pago.referencia && (
                                          <small className="pago-ref">Ref: {pago.referencia}</small>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            
                            <td className="col-total">
                              <div className="factura-total">
                                {formatoMoneda(totalFactura)}
                              </div>
                            </td>
                            
                            <td className="col-vuelto">
                              <div className={`factura-vuelto ${factura.vuelto > 0 ? 'con-vuelto' : ''}`}>
                                {factura.vuelto > 0 ? (
                                  <>
                                    <span className="vuelto-icono">💸</span>
                                    {formatoMoneda(factura.vuelto)}
                                  </>
                                ) : (
                                  <span className="sin-vuelto">—</span>
                                )}
                              </div>
                            </td>
                            
                            <td className="col-acciones">
                              <button 
                                className="btn-ver-factura"
                                onClick={() => {
                                  // Aquí iría la navegación al detalle de la factura
                                  console.log('Ver factura:', factura.numeroFactura);
                                }}
                                title="Ver detalles de la factura"
                              >
                                <span className="accion-icono">👁️</span>
                                Ver
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Resumen final */}
              <div className="resumen-final">
                <div className="resumen-item">
                  <span className="resumen-label">Facturas Totales:</span>
                  <span className="resumen-valor">{estadisticas.totalFacturas}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Transacciones Totales:</span>
                  <span className="resumen-valor">{estadisticas.totalTransacciones}</span>
                </div>
                <div className="resumen-item">
                  <span className="resumen-label">Total General:</span>
                  <span className="resumen-valor total">{formatoMoneda(reporte.totalGeneral)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      ) : !loading && !error && (
        <div className="sin-datos">
          <div className="sin-datos-icono">📊</div>
          <h3>Seleccione una fecha</h3>
          <p>Elija una fecha del calendario para generar el reporte diario.</p>
        </div>
      )}
    </div>
  );
}