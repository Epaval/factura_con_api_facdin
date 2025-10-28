import { useState } from 'react';
import { api } from '../services/api';
import './NotasCredito.css'; // Asegúrate de importar tu archivo CSS

export default function NotasCredito() {
  const [datos, setDatos] = useState({
    factura_id: '',
    tipo: 'credito',
    motivo: '',
    monto_afectado: ''
  });
  const [loading, setLoading] = useState(false);

  // Motivos predefinidos
  const motivos = [
    'Devolución por Averiado',
    'Cambio por Otro Producto',
    'Decisión del Cliente',
    'Por Vencimiento'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post(
        '/notas/crear',
        datos,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('facdin_token')}` }
        }
      );
      alert('✅ Nota creada exitosamente');
      // Resetear formulario después del éxito
      setDatos({
        factura_id: '',
        tipo: 'credito',
        motivo: '',
        monto_afectado: ''
      });
    } catch (err) {
      alert('❌ Error: ' + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoNotaInfo = () => {
    if (datos.tipo === 'credito') {
      return {
        titulo: "Nota de Crédito",
        descripcion: "Acredita un valor a favor del cliente. Se utiliza para devoluciones, descuentos o bonificaciones.",
        clase: "credito"
      };
    } else {
      return {
        titulo: "Nota de Débito", 
        descripcion: "Debita un valor al cliente. Se utiliza para cargos adicionales, intereses o correcciones.",
        clase: "debito"
      };
    }
  };

  const infoTipo = getTipoNotaInfo();

  return (
    <div className="notas-container">
      <h2 className="notas-title">Crear Nota de Crédito/Débito</h2>
      
      <form onSubmit={handleSubmit} className="notas-form">
        {/* Información del tipo de nota seleccionado */}
        <div className={`tipo-nota-info ${infoTipo.clase}`}>
          <div className="tipo-nota-title">
            <span className={`nota-icon ${infoTipo.clase}`}>{infoTipo.titulo}</span>
          </div>
          <div className="tipo-nota-desc">{infoTipo.descripcion}</div>
        </div>

        <div className="form-group">
          <label htmlFor="factura_id" className="form-label">
            ID de la Factura
          </label>
          <input
            type="number"
            id="factura_id"
            placeholder="Ingrese el ID de la factura a modificar"
            value={datos.factura_id}
            onChange={(e) => setDatos({ ...datos, factura_id: e.target.value })}
            className="form-input"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tipo" className="form-label">
            Tipo de Nota
          </label>
          <select
            id="tipo"
            value={datos.tipo}
            onChange={(e) => setDatos({ ...datos, tipo: e.target.value })}
            className="form-select"
            disabled={loading}
          >
            <option value="credito">Nota de Crédito</option>
            <option value="debito">Nota de Débito</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="motivo" className="form-label">
            Motivo
          </label>
          <select
            id="motivo"
            value={datos.motivo}
            onChange={(e) => setDatos({ ...datos, motivo: e.target.value })}
            className="form-select motivo-select"
            required
            disabled={loading}
          >
            <option value="">Seleccione un motivo</option>
            {motivos.map((motivo, index) => (
              <option key={index} value={motivo}>
                {motivo}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="monto_afectado" className="form-label">
            Monto Afectado (Bs.)
          </label>
          <input
            type="number"
            id="monto_afectado"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={datos.monto_afectado}
            onChange={(e) => setDatos({ ...datos, monto_afectado: e.target.value })}
            className="form-input"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          className={`submit-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : (
            'Crear Nota'
          )}
        </button>
      </form>
    </div>
  );
}