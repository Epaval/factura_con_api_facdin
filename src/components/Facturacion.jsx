import { useState } from 'react';
import { api } from '../services/api';
import Tooltip from './Tooltip';
import './Facturacion.css';

export default function Facturacion() {
  const [factura, setFactura] = useState({
    rifReceptor: '',
    razonSocialReceptor: '',
    detalles: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
  });
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState({ isVisible: false, message: '', type: 'info' });

  const showTooltip = (message, type = 'info') => {
    setTooltip({ isVisible: true, message, type });
  };

  const closeTooltip = () => {
    setTooltip({ isVisible: false, message: '', type: 'info' });
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const newDetalles = [...factura.detalles];
    newDetalles[index][name] = name === 'cantidad' || name === 'precioUnitario' ? parseFloat(value) || 0 : value;
    setFactura({ ...factura, detalles: newDetalles });
  };

  const addDetalle = () => {
    setFactura({
      ...factura,
      detalles: [...factura.detalles, { descripcion: '', cantidad: 1, precioUnitario: 0 }]
    });
  };

  const removeDetalle = (index) => {
    if (factura.detalles.length > 1) {
      const newDetalles = factura.detalles.filter((_, i) => i !== index);
      setFactura({ ...factura, detalles: newDetalles });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(
        '/facturas/insertar',
        factura,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('facdin_token')}` }
        }
      );
      showTooltip(`✅ Factura registrada: ${res.data.numeroFactura}`, 'success');
      setFactura({
        rifReceptor: '',
        razonSocialReceptor: '',
        detalles: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error desconocido';
      showTooltip(`❌ Error: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = factura.detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className="facturacion-container">
      <h2 className="facturacion-title">Emitir Factura</h2>

      <Tooltip
        message={tooltip.message}
        type={tooltip.type}
        isVisible={tooltip.isVisible}
        onClose={closeTooltip}
      />

      <form onSubmit={handleSubmit} className="facturacion-form">
        <div className="cliente-section">
          <h3>Cliente</h3>
          <div className="form-grid">
            <div>
              <label htmlFor="rifReceptor">RIF Receptor</label>
              <input
                id="rifReceptor"
                type="text"
                placeholder="J-123456789"
                value={factura.rifReceptor}
                onChange={(e) => setFactura({ ...factura, rifReceptor: e.target.value })}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="razonSocialReceptor">Razón Social</label>
              <input
                id="razonSocialReceptor"
                type="text"
                placeholder="Nombre del cliente"
                value={factura.razonSocialReceptor}
                onChange={(e) => setFactura({ ...factura, razonSocialReceptor: e.target.value })}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="productos-section">
          <h3>Detalles de la Factura</h3>
          {factura.detalles.map((d, i) => (
            <div key={i} className="detalle-row">
              <div>
                <label htmlFor={`descripcion-${i}`}>Descripción</label>
                <input
                  id={`descripcion-${i}`}
                  type="text"
                  name="descripcion"
                  placeholder="Producto o servicio"
                  value={d.descripcion}
                  onChange={(e) => handleChange(e, i)}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor={`cantidad-${i}`}>Cant.</label>
                <input
                  id={`cantidad-${i}`}
                  type="number"
                  name="cantidad"
                  placeholder="0"
                  value={d.cantidad}
                  onChange={(e) => handleChange(e, i)}
                  className="form-input"
                  min="1"
                  step="1"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor={`precioUnitario-${i}`}>Precio Unitario</label>
                <input
                  id={`precioUnitario-${i}`}
                  type="number"
                  name="precioUnitario"
                  placeholder="0.00"
                  value={d.precioUnitario}
                  onChange={(e) => handleChange(e, i)}
                  className="form-input"
                  min="0"
                  step="0.01"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label>Total</label>
                <div className="total-line">${(d.cantidad * d.precioUnitario).toFixed(2)}</div>
              </div>
              {factura.detalles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDetalle(i)}
                  className="remove-btn"
                  disabled={loading}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addDetalle}
            className="add-detalle-btn"
            disabled={loading}
          >
            + Añadir producto/servicio
          </button>
        </div>

        <div className="resumen-factura">
          <h3>Resumen de Factura</h3>
          <div className="resumen-grid">
            <div className="resumen-item">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="resumen-item">
              <span>IVA (16%):</span>
              <span>${iva.toFixed(2)}</span>
            </div>
            <div className="resumen-item total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrar Factura'}
        </button>
      </form>
    </div>
  );
}