 // src/components/ListaFacturas.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerFacturasRecientes } from '../services/facturasApi';
import './ListaFacturas.css';

// ✅ Configuración de tipos de estado
const ESTADOS_FACTURA = {
  pagada: { color: '#27ae60', icon: '✅', label: 'Pagada' },
  pendiente: { color: '#f39c12', icon: '⏳', label: 'Pendiente' },
  anulada: { color: '#e74c3c', icon: '❌', label: 'Anulada' },
  vencida: { color: '#95a5a6', icon: '⚠️', label: 'Vencida' }
};

export default function ListaFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [orden, setOrden] = useState('fecha_desc');
  
  const facturasPorPagina = 10;
  const navigate = useNavigate();

  // ✅ Cargar facturas
  useEffect(() => {
    const cargarFacturas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await obtenerFacturasRecientes();
        const facturasFormateadas = (data || []).map(f => ({
          ...f,
          fecha_formateada: formatearFecha(f.fecha),
          estado_determinado: determinarEstado(f)
        }));
        
        setFacturas(facturasFormateadas);
        setFiltradas(facturasFormateadas);
      } catch (err) {
        console.error('Error al cargar facturas:', err);
        setError('No se pudieron cargar las facturas. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    cargarFacturas();
  }, []);

  // ✅ Determinar estado de la factura
  const determinarEstado = (factura) => {
    if (factura.estado === 'pagada') return 'pagada';
    if (factura.estado === 'anulada') return 'anulada';
    
    // Lógica para determinar si está vencida
    if (factura.fecha_vencimiento) {
      const hoy = new Date();
      const vencimiento = new Date(factura.fecha_vencimiento);
      if (vencimiento < hoy) return 'vencida';
    }
    
    return 'pendiente';
  };

  // ✅ Formatear fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr || fechaStr === 'N/A') return 'N/A';
    
    try {
      // Si ya está en formato DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) return fechaStr;
      
      // Formato YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        const [y, m, d] = fechaStr.split('-');
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
      
      // Formato ISO
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha.getTime())) {
        const d = fecha.getDate().toString().padStart(2, '0');
        const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const y = fecha.getFullYear();
        return `${d}/${m}/${y}`;
      }
      
      return fechaStr;
    } catch {
      return 'Fecha inválida';
    }
  };

  // ✅ Filtrar y ordenar facturas
  useEffect(() => {
    let resultado = [...facturas];
    
    // Aplicar filtro de búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase().trim();
      resultado = resultado.filter(f => 
        f.numero?.toLowerCase().includes(termino) ||
        f.cliente?.toLowerCase().includes(termino) ||
        f.razon_social_receptor?.toLowerCase().includes(termino) ||
        f.fecha_formateada?.includes(termino) ||
        f.total?.toString().includes(termino) ||
        f.rif_receptor?.toLowerCase().includes(termino)
      );
    }
    
    // Aplicar filtro de estado
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(f => f.estado_determinado === filtroEstado);
    }
    
    // Aplicar ordenamiento
    resultado.sort((a, b) => {
      switch (orden) {
        case 'fecha_desc':
          return new Date(b.fecha) - new Date(a.fecha);
        case 'fecha_asc':
          return new Date(a.fecha) - new Date(b.fecha);
        case 'total_desc':
          return parseFloat(b.total) - parseFloat(a.total);
        case 'total_asc':
          return parseFloat(a.total) - parseFloat(b.total);
        case 'numero_desc':
          return b.numero?.localeCompare(a.numero) || 0;
        case 'numero_asc':
          return a.numero?.localeCompare(b.numero) || 0;
        default:
          return 0;
      }
    });
    
    setFiltradas(resultado);
    setPaginaActual(1);
  }, [busqueda, facturas, filtroEstado, orden]);

  // ✅ Calcular estadísticas
  const estadisticas = useMemo(() => {
    const total = facturas.length;
    const totalMonto = facturas.reduce((sum, f) => sum + (parseFloat(f.total) || 0), 0);
    const pagadas = facturas.filter(f => f.estado_determinado === 'pagada').length;
    const pendientes = facturas.filter(f => f.estado_determinado === 'pendiente').length;
    
    return {
      total,
      totalMonto: totalMonto.toFixed(2),
      pagadas,
      pendientes,
      porcentajePagadas: total > 0 ? Math.round((pagadas / total) * 100) : 0
    };
  }, [facturas]);

  // ✅ Paginación
  const totalPaginas = Math.ceil(filtradas.length / facturasPorPagina);
  const indiceInicio = (paginaActual - 1) * facturasPorPagina;
  const indiceFin = indiceInicio + facturasPorPagina;
  const facturasPaginadas = filtradas.slice(indiceInicio, indiceFin);

  const cambiarPagina = (pagina) => {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaActual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const verDetalle = (facturaId) => {
    navigate(`/facturas/detalle/${facturaId}`);
  };

  const crearFactura = () => {
    navigate('/facturas/nueva');
  };

  const exportarFacturas = () => {
    // Implementar exportación a CSV/Excel
    alert('Funcionalidad de exportación en desarrollo');
  };

  // ✅ Renderizar estados de carga y error
  if (loading) {
    return (
      <div className="lista-facturas-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando facturas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lista-facturas-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar facturas</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-reintentar"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-facturas-container">
      {/* Header con título y estadísticas */}
      <header className="facturas-header">
        <div className="header-titulo">
          <h1 className="titulo-principal">
            <span className="titulo-icono">📄</span>
            Facturas Registradas
          </h1>
          <p className="subtitulo">Gestión y seguimiento de facturas del sistema</p>
        </div>
        
        <div className="header-estadisticas">
          <div className="estadistica-card">
            <span className="estadistica-icono">📊</span>
            <div className="estadistica-contenido">
              <span className="estadistica-valor">{estadisticas.total}</span>
              <span className="estadistica-label">Total Facturas</span>
            </div>
          </div>
          
          <div className="estadistica-card">
            <span className="estadistica-icono">💰</span>
            <div className="estadistica-contenido">
              <span className="estadistica-valor">Bs. {estadisticas.totalMonto}</span>
              <span className="estadistica-label">Monto Total</span>
            </div>
          </div>
          
          <div className="estadistica-card">
            <span className="estadistica-icono">✅</span>
            <div className="estadistica-contenido">
              <span className="estadistica-valor">{estadisticas.pagadas}</span>
              <span className="estadistica-label">Pagadas</span>
            </div>
          </div>
          
          <div className="estadistica-card">
            <span className="estadistica-icono">⏳</span>
            <div className="estadistica-contenido">
              <span className="estadistica-valor">{estadisticas.pendientes}</span>
              <span className="estadistica-label">Pendientes</span>
            </div>
          </div>
        </div>
      </header>

      {/* Panel de control */}
      <div className="panel-control">
        {/* Barra de búsqueda */}
        <div className="buscador-container">
          <div className="buscador-input-wrapper">
            <span className="buscador-icono">🔍</span>
            <input
              type="text"
              placeholder="Buscar por número, cliente, RIF, fecha o monto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')}
                className="btn-limpiar-busqueda"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="resultados-busqueda">
            {filtradas.length} facturas encontradas
            {busqueda && ` para "${busqueda}"`}
          </div>
        </div>

        {/* Filtros y controles */}
        <div className="filtros-container">
          <div className="filtro-grupo">
            <label className="filtro-label">
              <span className="filtro-icono">📊</span>
              Estado:
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="select-filtro"
            >
              <option value="todos">Todos los estados</option>
              <option value="pagada">✅ Pagadas</option>
              <option value="pendiente">⏳ Pendientes</option>
              <option value="vencida">⚠️ Vencidas</option>
              <option value="anulada">❌ Anuladas</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label className="filtro-label">
              <span className="filtro-icono">📈</span>
              Ordenar por:
            </label>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="select-filtro"
            >
              <option value="fecha_desc">Fecha (más reciente)</option>
              <option value="fecha_asc">Fecha (más antigua)</option>
              <option value="total_desc">Monto (mayor a menor)</option>
              <option value="total_asc">Monto (menor a mayor)</option>
              <option value="numero_desc">Número (descendente)</option>
              <option value="numero_asc">Número (ascendente)</option>
            </select>
          </div>

          <div className="acciones-grupo">
            <button 
              onClick={crearFactura}
              className="btn-accion btn-crear"
            >
              <span className="btn-icono">➕</span>
              Nueva Factura
            </button>
            
            <button 
              onClick={exportarFacturas}
              className="btn-accion btn-exportar"
            >
              <span className="btn-icono">📥</span>
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="facturas-grid-container">
        {filtradas.length === 0 ? (
          <div className="sin-resultados">
            <div className="sin-resultados-icono">📭</div>
            <h3>No se encontraron facturas</h3>
            <p>Intenta cambiar los filtros o crear una nueva factura</p>
            <button 
              onClick={crearFactura}
              className="btn-crear-principal"
            >
              <span className="btn-icono">➕</span>
              Crear primera factura
            </button>
          </div>
        ) : (
          <>
            <div className="facturas-grid">
              {facturasPaginadas.map((factura) => {
                const estadoConfig = ESTADOS_FACTURA[factura.estado_determinado] || ESTADOS_FACTURA.pendiente;
                
                return (
                  <div 
                    key={factura.id} 
                    className={`factura-card estado-${factura.estado_determinado}`}
                    onClick={() => verDetalle(factura.id)}
                  >
                    <div className="factura-header">
                      <div className="factura-numero">
                        <span className="numero-icono">#</span>
                        <h3 className="numero-texto">
                          {factura.numero || factura.id || 'Sin número'}
                        </h3>
                      </div>
                      
                      <div 
                        className="factura-estado"
                        style={{ backgroundColor: estadoConfig.color + '20' }}
                      >
                        <span className="estado-icono">{estadoConfig.icon}</span>
                        <span className="estado-texto">{estadoConfig.label}</span>
                      </div>
                    </div>
                    
                    <div className="factura-cliente">
                      <div className="cliente-info">
                        <span className="cliente-icono">👤</span>
                        <div className="cliente-detalles">
                          <strong className="cliente-nombre">
                            {factura.razon_social_receptor || factura.cliente || 'Cliente no especificado'}
                          </strong>
                          {factura.rif_receptor && (
                            <small className="cliente-rif">RIF: {factura.rif_receptor}</small>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="factura-detalles">
                      <div className="detalle-item">
                        <span className="detalle-label">Fecha:</span>
                        <span className="detalle-valor">{factura.fecha_formateada}</span>
                      </div>
                      
                      <div className="detalle-item">
                        <span className="detalle-label">Subtotal:</span>
                        <span className="detalle-valor">
                          Bs. {parseFloat(factura.subtotal || 0).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="detalle-item">
                        <span className="detalle-label">IVA:</span>
                        <span className="detalle-valor">
                          Bs. {parseFloat(factura.iva || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="factura-total">
                      <span className="total-label">TOTAL:</span>
                      <span className="total-valor">
                        Bs. {parseFloat(factura.total || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="factura-acciones">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          verDetalle(factura.id);
                        }}
                        className="btn-ver-detalle"
                      >
                        <span className="accion-icono">👁️</span>
                        Ver Detalle
                      </button>
                      
                      {factura.estado_determinado === 'pendiente' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/facturas/pagar/${factura.id}`);
                          }}
                          className="btn-pagar-factura"
                        >
                          <span className="accion-icono">💳</span>
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginador */}
            {totalPaginas > 1 && (
              <div className="paginador">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="btn-paginador btn-paginador-prev"
                  aria-label="Página anterior"
                >
                  <span className="paginador-icono">←</span>
                  Anterior
                </button>
                
                <div className="paginador-numeros">
                  {(() => {
                    const paginas = [];
                    const paginasVisibles = 5;
                    let inicio = Math.max(1, paginaActual - Math.floor(paginasVisibles / 2));
                    let fin = Math.min(totalPaginas, inicio + paginasVisibles - 1);
                    
                    if (fin - inicio + 1 < paginasVisibles) {
                      inicio = Math.max(1, fin - paginasVisibles + 1);
                    }
                    
                    if (inicio > 1) {
                      paginas.push(
                        <button
                          key={1}
                          onClick={() => cambiarPagina(1)}
                          className="btn-paginador-numero"
                        >
                          1
                        </button>
                      );
                      
                      if (inicio > 2) {
                        paginas.push(
                          <span key="ellipsis-start" className="paginador-ellipsis">
                            ...
                          </span>
                        );
                      }
                    }
                    
                    for (let i = inicio; i <= fin; i++) {
                      paginas.push(
                        <button
                          key={i}
                          onClick={() => cambiarPagina(i)}
                          className={`btn-paginador-numero ${paginaActual === i ? 'activo' : ''}`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    if (fin < totalPaginas) {
                      if (fin < totalPaginas - 1) {
                        paginas.push(
                          <span key="ellipsis-end" className="paginador-ellipsis">
                            ...
                          </span>
                        );
                      }
                      
                      paginas.push(
                        <button
                          key={totalPaginas}
                          onClick={() => cambiarPagina(totalPaginas)}
                          className="btn-paginador-numero"
                        >
                          {totalPaginas}
                        </button>
                      );
                    }
                    
                    return paginas;
                  })()}
                </div>
                
                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="btn-paginador btn-paginador-next"
                  aria-label="Página siguiente"
                >
                  Siguiente
                  <span className="paginador-icono">→</span>
                </button>
                
                <div className="paginador-info">
                  Mostrando {indiceInicio + 1}-{Math.min(indiceFin, filtradas.length)} de {filtradas.length} facturas
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Resumen rápido */}
      <div className="resumen-rapido">
        <div className="resumen-item">
          <span className="resumen-label">Facturas por página:</span>
          <span className="resumen-valor">{facturasPorPagina}</span>
        </div>
        <div className="resumen-item">
          <span className="resumen-label">Página actual:</span>
          <span className="resumen-valor">{paginaActual} de {totalPaginas}</span>
        </div>
        <div className="resumen-item">
          <span className="resumen-label">Tasa de pago:</span>
          <span className="resumen-valor">{estadisticas.porcentajePagadas}%</span>
        </div>
      </div>
    </div>
  );
}