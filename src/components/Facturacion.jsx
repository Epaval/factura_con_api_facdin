import { useState } from 'react';
import { api } from '../services/api';
import './Facturacion.css'; // Asegúrate de importar tu archivo CSS

export default function Facturacion() {
  const [factura, setFactura] = useState({
    rifReceptor: '',
    razonSocialReceptor: '',
    detalles: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const newDetalles = [...factura.detalles];
    newDetalles[index][name] = name === 'cantidad' || name === 'precioUnitario' ? parseFloat(value) : value;
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
      alert('✅ Factura registrada: ' + res.data.numeroFactura);
      // Resetear formulario después del éxito
      setFactura({
        rifReceptor: '',
        razonSocialReceptor: '',
        detalles: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }]
      });
    } catch (err) {
      alert('❌ Error: ' + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totales
  const subtotal = factura.detalles.reduce((sum, detalle) => 
    sum + (detalle.cantidad * detalle.precioUnitario), 0
  );
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className="facturacion-container">
      <h2 className="facturacion-title">Emitir Factura</h2>
      
      <form onSubmit={handleSubmit} className="facturacion-form">
        <input
          type="text"
          placeholder="RIF Receptor (ej: J-123456789)"
          value={factura.rifReceptor}
          onChange={(e) => setFactura({ ...factura, rifReceptor: e.target.value })}
          className="form-input"
          required
          disabled={loading}
        />
        
        <input
          type="text"
          placeholder="Razón Social del Receptor"
          value={factura.razonSocialReceptor}
          onChange={(e) => setFactura({ ...factura, razonSocialReceptor: e.target.value })}
          className="form-input"
          required
          disabled={loading}
        />

        <div className="detalles-container">
          <h3 className="detalles-title">Detalles de la Factura</h3>
          {factura.detalles.map((d, i) => (
            <div key={i} className="detalle-row">
              <input
                type="text"
                name="descripcion"
                placeholder="Descripción del producto/servicio"
                value={d.descripcion}
                onChange={(e) => handleChange(e, i)}
                className="form-input detalle-descripcion"
                required
                disabled={loading}
              />
              <input
                type="number"
                name="cantidad"
                placeholder="Cant."
                value={d.cantidad}
                onChange={(e) => handleChange(e, i)}
                className="form-input detalle-cantidad"
                min="1"
                step="1"
                required
                disabled={loading}
              />
              <input
                type="number"
                name="precioUnitario"
                placeholder="Precio Unitario"
                value={d.precioUnitario}
                onChange={(e) => handleChange(e, i)}
                className="form-input detalle-precio"
                min="0"
                step="0.01"
                required
                disabled={loading}
              />
              {factura.detalles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDetalle(i)}
                  className="remove-button"
                  disabled={loading}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button 
          type="button" 
          onClick={addDetalle} 
          className="add-detalle-button"
          disabled={loading}
        >
          + Añadir producto/servicio
        </button>

        {/* Resumen de la factura */}
        <div className="resumen-factura">
          <h4 className="resumen-title">Resumen de Factura</h4>
          <div className="resumen-item">
            <span className="resumen-label">Subtotal:</span>
            <span className="resumen-value">${subtotal.toFixed(2)}</span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">IVA (16%):</span>
            <span className="resumen-value">${iva.toFixed(2)}</span>
          </div>
          <div className="resumen-item">
            <span className="resumen-label">Total:</span>
            <span className="resumen-value">${total.toFixed(2)}</span>
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