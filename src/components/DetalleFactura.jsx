 // src/components/DetalleFactura.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerDetalleFactura } from '../services/facturasApi';
import './DetalleFactura.css';

// ✅ Función para formatear fecha YYYY-MM-DD → DD/MM/YYYY
const formatearFecha = (fechaStr) => {
  if (!fechaStr || fechaStr === 'N/A') return 'N/A';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
};

// ✅ Función segura para convertir a número
const toNumber = (valor) => {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    const num = parseFloat(valor);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export default function DetalleFactura() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDetalle = async () => {
      if (!id) return;

      try {
        const data = await obtenerDetalleFactura(id);
        setFactura(data);
      } catch (err) {
        console.error('Error al cargar detalle:', err);
        setError('No se pudo cargar la factura.');
      } finally {
        setLoading(false);
      }
    };

    cargarDetalle();
  }, [id]);

  if (loading) return <div className="detalle-container">Cargando factura...</div>;
  if (error) return (
    <div className="detalle-container">
      <p className="error">{error}</p>
      <button onClick={() => navigate('/facturas')} className="btn-volver">← Volver a facturas</button>
    </div>
  );

  if (!factura) return <div className="detalle-container">Factura no encontrada.</div>;

  return (
    <div className="detalle-container">
      <button onClick={() => navigate('/facturas')} className="btn-volver">← Volver a facturas</button>
      
      <div className="cabecera-factura">
        <h2>Factura N° {factura.numero_factura || factura.id}</h2>
        {/* ✅ Usa la función de formateo */}
        <p><strong>Fecha:</strong> {formatearFecha(factura.fecha)}</p>
      </div>

      <div className="seccion cliente-info">
        <h3>Cliente</h3>
        <p><strong>RIF/CI:</strong> {factura.rif_receptor || '—'}</p>
        <p><strong>Nombre:</strong> {factura.razon_social_receptor || '—'}</p>
      </div>

      <div className="seccion detalles">
        <h3>Detalles</h3>
        <table className="tabla-detalles">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.detalles?.map((d, i) => {
              const cantidad = toNumber(d.cantidad);
              const precioUnitario = toNumber(d.precio_unitario);
              const totalLinea = cantidad * precioUnitario;
              
              return (
                <tr key={i}>
                  <td>{d.descripcion || '—'}</td>
                  <td>{cantidad.toFixed(2)}</td>
                  <td>Bs. {precioUnitario.toFixed(2)}</td>
                  <td>Bs. {totalLinea.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="resumen">
        <div className="resumen-item">
          <span>Subtotal:</span>
          <span>Bs. {toNumber(factura.subtotal).toFixed(2)}</span>
        </div>
        <div className="resumen-item">
          <span>IVA (16%):</span>
          <span>Bs. {toNumber(factura.iva).toFixed(2)}</span>
        </div>
        <div className="resumen-item total">
          <span><strong>Total:</strong></span>
          <span><strong>Bs. {toNumber(factura.total).toFixed(2)}</strong></span>
        </div>
      </div>
    </div>
  );
}