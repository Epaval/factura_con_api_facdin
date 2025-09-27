import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Dashboard() {
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [ultimasFacturas, setUltimasFacturas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cajaData = localStorage.getItem('cajaData');
    setCajaAbierta(!!cajaData);
    cargarUltimasFacturas();
  }, []);

  const cargarUltimasFacturas = async () => {
    try {
      // Usar la api configurada en lugar de fetch directo
      const res = await api.get('/facturas/recientes');
      setUltimasFacturas(res.data);
    } catch (err) {
      console.log('Usando datos de demo para facturas');
      setUltimasFacturas([
        { id: 1, numero: 'F00000001', cliente: 'Cliente Demo', total: '116.00', fecha: new Date().toLocaleDateString() },
        { id: 2, numero: 'F00000002', cliente: 'Empresa XYZ', total: '285.50', fecha: new Date().toLocaleDateString() }
      ]);
    } finally {
      setLoading(false);
    }
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

        {/* Últimas Facturas */}
        <div className="facturas-container">
          <div className="facturas-header">
            <h2>Últimas Facturas Emitidas</h2>
            <p>Historial de las últimas transacciones</p>
          </div>
          <div className="facturas-table-container">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : (
              <table className="facturas-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasFacturas.length > 0 ? (
                    ultimasFacturas.map((factura) => (
                      <tr key={factura.id}>
                        <td className="factura-numero">{factura.numero}</td>
                        <td className="factura-cliente">{factura.cliente}</td>
                        <td className="factura-total">${factura.total}</td>
                        <td className="factura-fecha">{factura.fecha}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-facturas">
                        No se han emitido facturas aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <p>FACDIN - Sistema de Facturación Electrónica | Cumple con SENIAT Venezuela</p>
          <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}