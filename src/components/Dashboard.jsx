// src/components/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [ultimasFacturas, setUltimasFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [detalleModal, setDetalleModal] = useState(null);
  const [formEmpleado, setFormEmpleado] = useState({
    nombre: '',
    ficha: '',
    ci: '',
    rol: 'asesor',
    password: '',
    email: ''
  });
  const [mostrarFormEmpleado, setMostrarFormEmpleado] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    totalHoy: 0,
    facturasHoy: 0,
    promedioTicket: 0,
    clientesAtendidos: 0
  });
  const [cajaInfo, setCajaInfo] = useState(null);

  const LIMIT = 8;
  const navigate = useNavigate();

  // ✅ Cargar últimas facturas con useCallback para estabilidad
  const cargarUltimasFacturas = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (pagina - 1) * LIMIT;
      const res = await api.get(`/facturas/recientes?limit=${LIMIT}&offset=${offset}&search=${busqueda}`);
      setUltimasFacturas(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setUltimasFacturas([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pagina, busqueda]);

  // ✅ Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const res = await api.get(`/facturas/estadisticas?fecha=${hoy}`);
      setEstadisticas(res.data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, []);

  // ✅ Efecto principal
  useEffect(() => {
    const cajaData = localStorage.getItem('cajaData');
    setCajaAbierta(!!cajaData);
    if (cajaData) {
      setCajaInfo(JSON.parse(cajaData));
    }
    cargarUltimasFacturas();
    cargarEstadisticas();
  }, [cargarUltimasFacturas, cargarEstadisticas]);

  const abrirDetalle = async (facturaId) => {
    try {
      const res = await api.get(`/facturas/detalle/${facturaId}`);
      setDetalleModal(res.data);
    } catch (err) {
      console.error('Error al cargar detalle:', err);
      alert('No se pudo cargar el detalle de la factura');
    }
  };

  const cerrarDetalle = () => {
    setDetalleModal(null);
  };

  const totalPaginas = Math.ceil(total / LIMIT);
  const tienePaginaAnterior = pagina > 1;
  const tienePaginaSiguiente = pagina < totalPaginas;

  const registrarEmpleado = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/usuarios/registrar', formEmpleado);
      alert('✅ ' + res.data.message);
      setFormEmpleado({
        nombre: '',
        ficha: '',
        ci: '',
        rol: 'asesor',
        password: '',
        email: ''
      });
      setMostrarFormEmpleado(false);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || 'Error al registrar empleado'));
    }
  };

  const cerrarModalEmpleado = () => {
    setMostrarFormEmpleado(false);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2
    }).format(monto);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearHora = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const calcularEstadoPago = (pagos) => {
    if (!pagos || pagos.length === 0) return { icon: '❓', label: 'Sin pago', color: '#95a5a6' };
    const totalPagado = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    return totalPagado > 0 
      ? { icon: '✅', label: 'Pagada', color: '#27ae60' }
      : { icon: '⏳', label: 'Pendiente', color: '#f39c12' };
  };

  // ✅ Función para recargar todo
  const recargarDashboard = () => {
    cargarUltimasFacturas();
    cargarEstadisticas();
  };

  return (
    <div className="dashboard-container">
      {/* Background decorativo */}
      <div className="dashboard-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>
      
      <div className="dashboard-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">
              <span className="title-icon">📊</span>
              Panel de Control FACDIN
            </h1>
            <p className="dashboard-subtitle">
              Sistema de Facturación Electrónica - Gestión Inteligente
            </p>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <span className="user-avatar">👤</span>
              <div className="user-details">
                <span className="user-name">Administrador</span>
                <span className="user-role">Supervisor</span>
              </div>
            </div>
            
            <div className="header-actions">
              <button 
                className="btn-refresh"
                onClick={recargarDashboard}
                title="Actualizar datos"
              >
                🔄
              </button>
            </div>
          </div>
        </header>

        {/* Estadísticas principales */}
        <section className="stats-grid">
          <div className="stat-card total-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-label">Ventas Hoy</span>
              <span className="stat-value">{formatearMoneda(estadisticas.totalHoy)}</span>
              <span className="stat-change">+12% vs ayer</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <span className="stat-label">Facturas Hoy</span>
              <span className="stat-value">{estadisticas.facturasHoy}</span>
              <span className="stat-change">{estadisticas.promedioTicket > 0 ? formatearMoneda(estadisticas.promedioTicket) : '—'}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-label">Clientes Atendidos</span>
              <span className="stat-value">{estadisticas.clientesAtendidos}</span>
              <span className="stat-change">Últimas 24h</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <div className="stat-content">
              <span className="stat-label">Estado Caja</span>
              <span className={`stat-value ${cajaAbierta ? 'open' : 'closed'}`}>
                {cajaAbierta ? 'Abierta' : 'Cerrada'}
              </span>
              {cajaInfo && (
                <span className="stat-change">
                  {formatearHora(cajaInfo.fechaApertura)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Estado de caja detallado */}
        <div className="caja-detalle">
          <div className="caja-header">
            <h2 className="caja-title">
              <span className="caja-icon">🏪</span>
              Información de Caja
            </h2>
            <span className={`caja-status-badge ${cajaAbierta ? 'abierta' : 'cerrada'}`}>
              {cajaAbierta ? '🟢 ABIERTA' : '🔴 CERRADA'}
            </span>
          </div>
          
          <div className="caja-info">
            {cajaAbierta ? (
              <>
                <div className="caja-item">
                  <span className="caja-label">Responsable:</span>
                  <span className="caja-value">{cajaInfo?.responsable || 'No especificado'}</span>
                </div>
                <div className="caja-item">
                  <span className="caja-label">Apertura:</span>
                  <span className="caja-value">
                    {formatearFecha(cajaInfo?.fechaApertura)} - {formatearHora(cajaInfo?.fechaApertura)}
                  </span>
                </div>
                <div className="caja-item">
                  <span className="caja-label">Saldo Inicial:</span>
                  <span className="caja-value saldo">{formatearMoneda(cajaInfo?.saldoInicial || 0)}</span>
                </div>
                <div className="caja-item">
                  <span className="caja-label">Turno:</span>
                  <span className="caja-value turno">{cajaInfo?.turno || 'No definido'}</span>
                </div>
              </>
            ) : (
              <div className="caja-cerrada">
                <div className="cerrada-icon">🔒</div>
                <div className="cerrada-text">
                  <h3>Caja actualmente cerrada</h3>
                  <p>Para emitir facturas, primero debe abrir la caja</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <section className="quick-actions-section">
          <h2 className="section-title">
            <span className="section-icon">🚀</span>
            Acciones Rápidas
          </h2>
          
          <div className="actions-grid">
            <button
              onClick={() => navigate('/facturacion')}
              disabled={!cajaAbierta}
              className={`action-card ${cajaAbierta ? 'enabled' : 'disabled'}`}
            >
              <div className="action-icon factura">📄</div>
              <div className="action-content">
                <h3 className="action-title">Emitir Factura</h3>
                <p className="action-desc">
                  {cajaAbierta ? 'Crear nueva factura' : 'Caja cerrada'}
                </p>
              </div>
              <div className="action-badge">
                {cajaAbierta ? 'Disponible' : 'Bloqueado'}
              </div>
            </button>

            <button
              onClick={() => setMostrarFormEmpleado(true)}
              className="action-card empleado"
            >
              <div className="action-icon">👥</div>
              <div className="action-content">
                <h3 className="action-title">Registrar Empleado</h3>
                <p className="action-desc">Agregar nuevo personal</p>
              </div>
              <div className="action-badge">Nuevo</div>
            </button>

            <button
              onClick={() => navigate('/notas')}
              className="action-card nota"
            >
              <div className="action-icon">📝</div>
              <div className="action-content">
                <h3 className="action-title">Notas de Crédito</h3>
                <p className="action-desc">Devoluciones y ajustes</p>
              </div>
              <div className="action-badge">3 pendientes</div>
            </button>

            <button
              onClick={() => navigate('/caja')}
              className="action-card caja"
            >
              <div className="action-icon">💰</div>
              <div className="action-content">
                <h3 className="action-title">Control de Caja</h3>
                <p className="action-desc">Abrir/Cerrar caja</p>
              </div>
              <div className="action-badge">Gestión</div>
            </button>

            <button
              onClick={() => navigate('/reportes')}
              className="action-card reporte"
            >
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h3 className="action-title">Reportes</h3>
                <p className="action-desc">Análisis y estadísticas</p>
              </div>
              <div className="action-badge">Ver todos</div>
            </button>

            <button
              onClick={() => navigate('/clientes')}
              className="action-card cliente"
            >
              <div className="action-icon">👤</div>
              <div className="action-content">
                <h3 className="action-title">Gestión de Clientes</h3>
                <p className="action-desc">Base de datos clientes</p>
              </div>
              <div className="action-badge">215 registros</div>
            </button>
          </div>
        </section>

        {/* Facturas recientes */}
        <section className="facturas-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">📋</span>
              Facturas Recientes
            </h2>
            
            <div className="section-controls">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por número, cliente o RIF..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPagina(1);
                  }}
                  className="search-input"
                />
                {busqueda && (
                  <button 
                    className="clear-search"
                    onClick={() => setBusqueda('')}
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="pagination-info">
                Mostrando {Math.min((pagina - 1) * LIMIT + 1, total)}-{Math.min(pagina * LIMIT, total)} de {total}
              </div>
            </div>
          </div>
          
          <div className="facturas-table-container">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando facturas...</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="facturas-table">
                    <thead>
                      <tr>
                        <th className="col-numero">N° Factura</th>
                        <th className="col-cliente">Cliente</th>
                        <th className="col-fecha">Fecha</th>
                        <th className="col-estado">Estado</th>
                        <th className="col-total">Total</th>
                        <th className="col-acciones">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ultimasFacturas.length > 0 ? (
                        ultimasFacturas.map((factura) => {
                          const estado = calcularEstadoPago(factura.pagos);
                          
                          return (
                            <tr key={factura.id} className="factura-row">
                              <td className="col-numero">
                                <div className="factura-numero">
                                  <span className="numero-prefijo"></span>
                                  {factura.numero || factura.id}
                                </div>
                              </td>
                              <td className="col-cliente">
                                <div className="cliente-info">
                                  <span className="cliente-nombre">
                                    {factura.razon_social_receptor || factura.cliente || 'Cliente no registrado'}
                                  </span>
                                  {factura.rif_receptor && (
                                    <small className="cliente-rif">RIF: {factura.rif_receptor}</small>
                                  )}
                                </div>
                              </td>
                              <td className="col-fecha">
                                <div className="fecha-container">
                                  <span className="fecha-dia">{formatearFecha(factura.fecha)}</span>
                                  <small className="fecha-hora">{formatearHora(factura.fecha)}</small>
                                </div>
                              </td>
                              <td className="col-estado">
                                <span 
                                  className="estado-badge"
                                  style={{ backgroundColor: estado.color + '20', color: estado.color }}
                                >
                                  <span className="estado-icon">{estado.icon}</span>
                                  {estado.label}
                                </span>
                              </td>
                              <td className="col-total">
                                <div className="total-container">
                                  <span className="total-monto">{formatearMoneda(factura.total || 0)}</span>
                                  {factura.vuelto > 0 && (
                                    <small className="vuelto-info">Vuelto: {formatearMoneda(factura.vuelto)}</small>
                                  )}
                                </div>
                              </td>
                              <td className="col-acciones">
                                <div className="acciones-container">
                                  <button 
                                    onClick={() => abrirDetalle(factura.id)}
                                    className="btn-detalle"
                                    title="Ver detalle"
                                  >
                                    <span className="btn-icon">👁️</span>
                                    Ver
                                  </button>
                                  
                                  {factura.estado_determinado === 'pendiente' && (
                                    <button 
                                      onClick={() => navigate(`/facturas/pagar/${factura.id}`)}
                                      className="btn-pagar"
                                      title="Registrar pago"
                                    >
                                      <span className="btn-icon">💳</span>
                                      Pagar
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => window.print(factura.id)}
                                    className="btn-imprimir"
                                    title="Imprimir factura"
                                  >
                                    <span className="btn-icon">🖨️</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="no-data-row">
                          <td colSpan="6">
                            <div className="no-data">
                              <span className="no-data-icon">📭</span>
                              <div className="no-data-text">
                                <h3>No se encontraron facturas</h3>
                                <p>{busqueda ? 'Intenta con otros términos de búsqueda' : 'No hay facturas registradas'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => setPagina(pagina - 1)}
                      disabled={!tienePaginaAnterior}
                      className="pagination-btn prev"
                    >
                      <span className="pagination-icon">←</span>
                      Anterior
                    </button>
                    
                    <div className="pagination-numbers">
                      {[...Array(Math.min(5, totalPaginas))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagina(pageNum)}
                            className={`pagination-number ${pagina === pageNum ? 'active' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {totalPaginas > 5 && (
                        <>
                          <span className="pagination-ellipsis">...</span>
                          <button
                            onClick={() => setPagina(totalPaginas)}
                            className={`pagination-number ${pagina === totalPaginas ? 'active' : ''}`}
                          >
                            {totalPaginas}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setPagina(pagina + 1)}
                      disabled={!tienePaginaSiguiente}
                      className="pagination-btn next"
                    >
                      Siguiente
                      <span className="pagination-icon">→</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="dashboard-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="footer-icon">📊</span>
              <span className="footer-name">FACDIN</span>
            </div>
            
            <div className="footer-info">
              <p className="footer-text">
                Sistema de Facturación Electrónica | Cumple con normativas SENIAT Venezuela
              </p>
              <p className="footer-copyright">
                © {new Date().getFullYear()} Todos los derechos reservados • v2.1.0
              </p>
            </div>
            
            <div className="footer-stats">
              <div className="footer-stat">
                <span className="stat-value">{total}</span>
                <span className="stat-label">Facturas totales</span>
              </div>
              <div className="footer-stat">
                <span className="stat-value">{estadisticas.facturasHoy}</span>
                <span className="stat-label">Hoy</span>
              </div>
              <div className="footer-stat">
                <span className="stat-value">24/7</span>
                <span className="stat-label">Disponibilidad</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Modal de registro de empleado */}
      {mostrarFormEmpleado && (
        <div className="modal-overlay" onClick={cerrarModalEmpleado}>
          <div className="modal-content empleado-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">👥</span>
                <h3>Registrar Nuevo Empleado</h3>
              </div>
              <button className="modal-close" onClick={cerrarModalEmpleado} aria-label="Cerrar">
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={registrarEmpleado} className="empleado-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">👤</span>
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={formEmpleado.nombre}
                      onChange={(e) => setFormEmpleado({...formEmpleado, nombre: e.target.value})}
                      className="form-input"
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🔢</span>
                      Ficha de Empleado
                    </label>
                    <input
                      type="text"
                      value={formEmpleado.ficha}
                      onChange={(e) => setFormEmpleado({...formEmpleado, ficha: e.target.value})}
                      className="form-input"
                      placeholder="Ej: FAC001"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🆔</span>
                      Cédula de Identidad
                    </label>
                    <input
                      type="text"
                      value={formEmpleado.ci}
                      onChange={(e) => setFormEmpleado({...formEmpleado, ci: e.target.value})}
                      className="form-input"
                      placeholder="Ej: V-12345678"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">📧</span>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formEmpleado.email}
                      onChange={(e) => setFormEmpleado({...formEmpleado, email: e.target.value})}
                      className="form-input"
                      placeholder="ejemplo@empresa.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🎯</span>
                      Rol del Empleado
                    </label>
                    <select
                      value={formEmpleado.rol}
                      onChange={(e) => setFormEmpleado({...formEmpleado, rol: e.target.value})}
                      className="form-select"
                      required
                    >
                      <option value="asesor">👨‍💼 Asesor de Ventas</option>
                      <option value="ga">👔 Gerente de Área (GA)</option>
                      <option value="gae">🎖️ Gerente de Área Especializado (GAE)</option>
                      <option value="administrador">👑 Administrador</option>
                      <option value="cajero">💰 Cajero</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🔒</span>
                      Contraseña Temporal
                    </label>
                    <input
                      type="password"
                      value={formEmpleado.password}
                      onChange={(e) => setFormEmpleado({...formEmpleado, password: e.target.value})}
                      className="form-input"
                      placeholder="Mínimo 8 caracteres"
                      required
                      minLength="8"
                    />
                    <small className="form-hint">El empleado deberá cambiar su contraseña en el primer acceso</small>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    <span className="btn-icon">✅</span>
                    Registrar Empleado
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={cerrarModalEmpleado}
                  >
                    <span className="btn-icon">✕</span>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de factura */}
      {detalleModal && (
        <div className="modal-overlay" onClick={cerrarDetalle}>
          <div className="modal-content factura-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">📄</span>
                <div>
                  <h3>Detalle de Factura</h3>
                  <p className="modal-subtitle">
                    #{detalleModal.factura?.numero_factura || detalleModal.factura?.id}
                  </p>
                </div>
              </div>
              <div className="modal-actions">
                <button className="modal-action" onClick={() => window.print()}>
                  <span className="action-icon">🖨️</span>
                  Imprimir
                </button>
                <button className="modal-close" onClick={cerrarDetalle} aria-label="Cerrar">
                  ✕
                </button>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="factura-info-grid">
                <div className="info-group">
                  <h4 className="info-title">Información del Cliente</h4>
                  <div className="info-content">
                    <div className="info-item">
                      <span className="info-label">Razón Social:</span>
                      <span className="info-value">{detalleModal.factura?.razon_social_receptor || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">RIF:</span>
                      <span className="info-value">{detalleModal.factura?.rif_receptor || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Dirección:</span>
                      <span className="info-value">{detalleModal.factura?.direccion_receptor || '—'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="info-group">
                  <h4 className="info-title">Datos de la Factura</h4>
                  <div className="info-content">
                    <div className="info-item">
                      <span className="info-label">Fecha de Emisión:</span>
                      <span className="info-value">{formatearFecha(detalleModal.factura?.fecha)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Hora:</span>
                      <span className="info-value">{formatearHora(detalleModal.factura?.fecha)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Estado:</span>
                      <span className="info-value estado">{detalleModal.factura?.estado || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detalles de la factura */}
              <div className="detalles-section">
                <h4 className="section-title">Detalles de la Factura</h4>
                <div className="table-responsive">
                  <table className="detalles-table">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalleModal.detalles?.map((detalle, index) => (
                        <tr key={index}>
                          <td className="descripcion">{detalle.descripcion}</td>
                          <td className="cantidad">{detalle.cantidad}</td>
                          <td className="precio">{formatearMoneda(detalle.precio_unitario)}</td>
                          <td className="total">{formatearMoneda(detalle.monto_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Totales */}
              <div className="totales-section">
                <div className="totales-grid">
                  <div className="total-item">
                    <span className="total-label">Subtotal:</span>
                    <span className="total-value">{formatearMoneda(detalleModal.factura?.subtotal || 0)}</span>
                  </div>
                  <div className="total-item">
                    <span className="total-label">IVA (16%):</span>
                    <span className="total-value">{formatearMoneda(detalleModal.factura?.iva || 0)}</span>
                  </div>
                  <div className="total-item total-general">
                    <span className="total-label">Total General:</span>
                    <span className="total-value">{formatearMoneda(detalleModal.factura?.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 