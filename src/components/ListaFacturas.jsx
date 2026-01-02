// src/components/ListaFacturas.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerFacturasRecientes } from '../services/facturasApi';
import './ListaFacturas.css';

export default function ListaFacturas() {
  const [todasFacturas, setTodasFacturas] = useState([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const facturasPorPagina = 6;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarFacturas = async () => {
      try {
        const data = await obtenerFacturasRecientes();
        setTodasFacturas(data || []);
        setFacturasFiltradas(data || []);
        setPaginaActual(1); // Reiniciar a primera página al cargar
      } catch (err) {
        console.error('Error al cargar facturas:', err);
        setError('No se pudieron cargar las facturas.');
      } finally {
        setLoading(false);
      }
    };

    cargarFacturas();
  }, []);

  // Filtrar facturas cuando cambia la búsqueda
  useEffect(() => {
    if (!busqueda.trim()) {
      setFacturasFiltradas(todasFacturas);
      setPaginaActual(1);
      return;
    }

    const termino = busqueda.toLowerCase().trim();
    const filtradas = todasFacturas.filter(factura =>
      factura.numero?.toLowerCase().includes(termino) ||
      factura.cliente?.toLowerCase().includes(termino) ||
      factura.fecha?.includes(termino) || // fecha es DD/MM/YYYY
      factura.total?.toString().includes(termino)
    );

    setFacturasFiltradas(filtradas);
    setPaginaActual(1); // Reiniciar a página 1 al buscar
  }, [busqueda, todasFacturas]);

  // Paginación
  const indiceUltimo = paginaActual * facturasPorPagina;
  const indicePrimero = indiceUltimo - facturasPorPagina;
  const facturasPaginadas = facturasFiltradas.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(facturasFiltradas.length / facturasPorPagina);

  const formatearFecha = (fecha) => {
    if (!fecha || fecha === 'N/A') return 'N/A';
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  };

  const verDetalle = (facturaId) => {
    navigate(`/facturas/detalle/${facturaId}`);
  };

  const cambiarPagina = (numero) => {
    setPaginaActual(numero);
  };

  if (loading) return <div className="facturas-container">Cargando facturas recientes...</div>;
  if (error) return <div className="facturas-container"><p className="error">{error}</p></div>;

  return (
    <div className="facturas-container">
      <h2>Facturas Recientes</h2>

      {/* Buscador */}
      <div className="buscador-facturas">
        <input
          type="text"
          placeholder="Buscar por número, cliente, fecha o total..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
      </div>

      {facturasFiltradas.length === 0 ? (
        <p>No se encontraron facturas.</p>
      ) : (
        <>
          <div className="facturas-list">
            {facturasPaginadas.map((f) => (
              <div key={f.id} className="factura-item">
                <div>
                  <strong>N°:</strong> {f.numero || f.id}
                </div>
                <div>
                  <strong>Cliente:</strong> {f.cliente || '—'}
                </div>
                <div>
                  <strong>Fecha:</strong> {formatearFecha(f.fecha)}
                </div>
                <div>
                  <strong>Total:</strong> Bs. {f.total || '—'}
                </div>
                <div>
                  <button 
                    onClick={() => verDetalle(f.id)}
                    className="btn-detalle"
                  >
                    Ver Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginador */}
          {totalPaginas > 1 && (
            <div className="paginador">
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="btn-paginador"
              >
                Anterior
              </button>

              {[...Array(totalPaginas)].map((_, i) => {
                const num = i + 1;
                return (
                  <button
                    key={num}
                    onClick={() => cambiarPagina(num)}
                    className={`btn-paginador ${paginaActual === num ? 'activo' : ''}`}
                  >
                    {num}
                  </button>
                );
              })}

              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="btn-paginador"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
