import { useState, useEffect } from 'react';
import { api } from '../services/api';

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

  const LIMIT = 5;

  useEffect(() => {
    const cajaData = localStorage.getItem('cajaData');
    setCajaAbierta(!!cajaData);
    cargarUltimasFacturas();
  }, [pagina, busqueda]);

  const cargarUltimasFacturas = async () => {
    try {
      const offset = (pagina - 1) * LIMIT;
      const res = await api.get(`/facturas/recientes?limit=${LIMIT}&offset=${offset}&search=${busqueda}`);
      setUltimasFacturas(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setUltimasFacturas([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalle = async (facturaId) => {
    try {
      const res = await api.get(`/facturas/detalle/${facturaId}`);
      setDetalleModal(res.data);
    } catch (err) {
      console.error('Error al cargar detalle:', err);
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
      alert(res.data.message);
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
      alert(err.response?.data?.error || 'Error al registrar empleado');
    }
  };

  const cerrarModalEmpleado = () => {
    setMostrarFormEmpleado(false);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        
        {/* Encabezado */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            Panel de Control FACDIN
          </h1>
          <p className="dashboard-subtitle">
            Bienvenido al sistema de facturación seguro y auditado
          </p>
        </div>

        {/* Estado de Caja */}
        <div className="caja-status">
          <div className="caja-status-content">
            <div className="caja-status-text">
              <h2>Estado de Caja</h2>
              <p>
                {cajaAbierta ? 'Caja abierta - Listo para facturar' : 'Caja cerrada'}
              </p>
            </div>
            <span
              className={`status-badge ${cajaAbierta ? 'open' : 'closed'}`}
            >
              {cajaAbierta ? (
                <>
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Abierta
                </>
              ) : (
                <>
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Cerrada
                </>
              )}
            </span>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="quick-actions">
          <button
            onClick={() => window.location.href = '/facturacion'}
            disabled={!cajaAbierta}
            className={`action-button ${cajaAbierta ? 'enabled' : 'disabled'}`}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3>Emitir Factura</h3>
            <p>
              {cajaAbierta ? 'Haz clic para comenzar' : 'Abre la caja primero'}
            </p>
          </button>

          <button
            onClick={() => setMostrarFormEmpleado(true)}
            className="action-button blue"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <h3>Registrar Empleado</h3>
            <p>Agregar nuevo empleado</p>
          </button>

          <button
            onClick={() => window.location.href = '/notas'}
            className="action-button green"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3>Notas de Crédito</h3>
            <p>Devoluciones o ajustes</p>
          </button>

          <button
            onClick={() => window.location.href = '/caja'}
            className="action-button purple"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.542-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.542-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.542.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.542.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3>Control de Caja</h3>
            <p>Abrir/Cerrar caja</p>
          </button>
        </div>

        {/* Modal de Registro de Empleado */}
        {mostrarFormEmpleado && (
          <div className="modal-overlay" onClick={cerrarModalEmpleado}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Registrar Nuevo Empleado</h3>
                <button className="close-btn" onClick={cerrarModalEmpleado}>✕</button>
              </div>
              
              <div className="modal-body">
                <form onSubmit={registrarEmpleado} className="empleado-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nombre">Nombre Completo</label>
                      <input
                        id="nombre"
                        type="text"
                        value={formEmpleado.nombre}
                        onChange={(e) => setFormEmpleado({...formEmpleado, nombre: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ficha">Ficha</label>
                      <input
                        id="ficha"
                        type="text"
                        value={formEmpleado.ficha}
                        onChange={(e) => setFormEmpleado({...formEmpleado, ficha: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="ci">Cédula de Identidad</label>
                      <input
                        id="ci"
                        type="text"
                        value={formEmpleado.ci}
                        onChange={(e) => setFormEmpleado({...formEmpleado, ci: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={formEmpleado.email}
                        onChange={(e) => setFormEmpleado({...formEmpleado, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="rol">Rol</label>
                      <select
                        id="rol"
                        value={formEmpleado.rol}
                        onChange={(e) => setFormEmpleado({...formEmpleado, rol: e.target.value})}
                        required
                      >
                        <option value="asesor">Asesor</option>
                        <option value="ga">Gerente de Área (GA)</option>
                        <option value="gae">Gerente de Área Especializado (GAE)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Contraseña</label>
                      <input
                        id="password"
                        type="password"
                        value={formEmpleado.password}
                        onChange={(e) => setFormEmpleado({...formEmpleado, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="submit-btn">Registrar Empleado</button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={cerrarModalEmpleado}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Últimas Facturas */}
        <div className="facturas-container">
          <div className="facturas-header">
            <h2>Últimas Facturas Emitidas</h2>
            <div className="facturas-controls">
              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1); // Reiniciar a primera página al buscar
                }}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="facturas-table-container">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <table className="facturas-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimasFacturas.length > 0 ? (
                      ultimasFacturas.map((factura) => (
                        <tr key={factura.id}>
                          <td className="factura-numero">
                            <button 
                              onClick={() => abrirDetalle(factura.id)}
                              className="detalle-btn"
                            >
                              {factura.numero}
                            </button>
                          </td>
                          <td className="factura-cliente">{factura.cliente}</td>
                          <td className="factura-total">${factura.total}</td>
                          <td className="factura-fecha">{factura.fecha}</td>
                          <td className="factura-acciones">
                            <button 
                              onClick={() => abrirDetalle(factura.id)}
                              className="detalle-btn"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-facturas">
                          No se han emitido facturas aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Paginación */}
                <div className="pagination">
                  <button 
                    onClick={() => setPagina(pagina - 1)}
                    disabled={!tienePaginaAnterior}
                    className="pagination-btn"
                  >
                    Anterior
                  </button>
                  
                  <span className="pagination-info">
                    Página {pagina} de {totalPaginas} ({total} total)
                  </span>
                  
                  <button 
                    onClick={() => setPagina(pagina + 1)}
                    disabled={!tienePaginaSiguiente}
                    className="pagination-btn"
                  >
                    Siguiente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal de Detalle */}
        {detalleModal && (
          <div className="modal-overlay" onClick={cerrarDetalle}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Detalle de Factura: {detalleModal.factura.numero_factura}</h3>
                <button className="close-btn" onClick={cerrarDetalle}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="factura-info">
                  <p><strong>Cliente:</strong> {detalleModal.factura.razon_social_receptor}</p>
                  <p><strong>RIF:</strong> {detalleModal.factura.rif_receptor}</p>
                  <p><strong>Fecha:</strong> {detalleModal.factura.fecha}</p>
                  <p><strong>Subtotal:</strong> ${detalleModal.factura.subtotal}</p>
                  <p><strong>IVA:</strong> ${detalleModal.factura.iva}</p>
                  <p><strong>Total:</strong> ${detalleModal.factura.total}</p>
                </div>
                
                <h4>Detalles de la Factura</h4>
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
                    {detalleModal.detalles.map((detalle, index) => (
                      <tr key={index}>
                        <td>{detalle.descripcion}</td>
                        <td>{detalle.cantidad}</td>
                        <td>${detalle.precio_unitario}</td>
                        <td>${detalle.monto_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="dashboard-footer">
          <p>FACDIN - Sistema de Facturación Electrónica | Cumple con SENIAT Venezuela</p>
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}