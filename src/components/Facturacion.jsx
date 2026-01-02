// src/components/Facturacion.jsx
import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import Tooltip from './Tooltip';
import { obtenerProductos, buscarClientes, buscarClientePorIdentificacion } from '../services/localDB';
import './Facturacion.css';

export default function Facturacion() {
  const [factura, setFactura] = useState({
    rifReceptor: '',
    razonSocialReceptor: '',
    detalles: []
  });
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState({ isVisible: false, message: '', type: 'info' });
  const [todosProductos, setTodosProductos] = useState([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [sugerenciasClientes, setSugerenciasClientes] = useState([]);
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const codigoInputRef = useRef(null);
  const rifReceptorRef = useRef(null);

  // Cargar productos al inicio
  useEffect(() => {
    const cargarProductos = async () => {
      const productos = await obtenerProductos(true);
      setTodosProductos(productos);
    };
    cargarProductos();
  }, []);

  // Focus automático en campo de código al cargar
  useEffect(() => {
    if (codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  }, []);

  const showTooltip = (message, type = 'info') => {
    setTooltip({ isVisible: true, message, type });
    setTimeout(closeTooltip, 4000);
  };

  const closeTooltip = () => {
    setTooltip({ isVisible: false, message: '', type: 'info' });
  };

 // Buscar cliente en base de datos local + autocompletar si es exacto
const handleIdentificacionChange = async (value) => {
  setFactura(prev => ({ ...prev, rifReceptor: value }));
  
  // Limpiar el nombre si el campo de identificación está vacío
  if (!value.trim()) {
    setFactura(prev => ({ ...prev, razonSocialReceptor: '' }));
    setSugerenciasClientes([]);
    return;
  }

  const cleanValue = value.toUpperCase().trim();

  // Mostrar sugerencias si el valor tiene al menos 2 caracteres
  if (cleanValue.length >= 2) {
    setBuscandoCliente(true);
    try {
      const clientes = await buscarClientes(cleanValue);
      setSugerenciasClientes(clientes);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      setSugerenciasClientes([]);
    } finally {
      setBuscandoCliente(false);
    }
  } else {
    setSugerenciasClientes([]);
  }

  // ✅ AUTOCOMPLETAR si la identificación es completa y válida
  // Patrones típicos en Venezuela:
  const esCI = /^[VE]\d{5,8}$/i.test(cleanValue); 
  const esRIF = /^[JG]-\d{7,9}-\d$/i.test(cleanValue); 

  if (esCI || esRIF) {
    // Buscar cliente EXACTO por identificación
    const clienteExacto = await buscarClientePorIdentificacion(cleanValue);
    if (clienteExacto) {      
      setFactura(prev => ({
        ...prev,
        rifReceptor: cleanValue,
        razonSocialReceptor: clienteExacto.nombre
      }));
      
      setSugerenciasClientes([]);
      setTimeout(() => {
        if (codigoInputRef.current) {
          codigoInputRef.current.focus();
        }
      }, 0);
    }
  }
};
  // Seleccionar cliente de sugerencias
  const seleccionarCliente = (cliente) => {
    const identificacion = cliente.ci || cliente.rif;
    setFactura(prev => ({
      ...prev,
      rifReceptor: identificacion,
      razonSocialReceptor: cliente.nombre
    }));
    setSugerenciasClientes([]);
    showTooltip(`✅ Cliente seleccionado: ${cliente.nombre}`, 'success');
  };

  // Buscar productos por código o descripción
  const buscarProductos = (termino) => {
    if (!termino.trim()) {
      setSugerenciasProductos([]);
      return;
    }

    const resultados = todosProductos.filter(p =>
      p.codigo.toLowerCase().includes(termino.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(termino.toLowerCase())
    ).slice(0, 5); // Limitar a 5 sugerencias

    setSugerenciasProductos(resultados);
  };

  // Agregar producto por código
  const agregarProductoPorCodigo = (codigo) => {
    if (!codigo.trim()) return;

    const producto = todosProductos.find(p => p.codigo === codigo.trim());

    if (!producto) {
      showTooltip(`❌ Producto no encontrado: ${codigo}`, 'error');
      return;
    }

    setFactura(prev => {
      const existe = prev.detalles.find(d => d.codigo === producto.codigo);

      if (existe) {
        return {
          ...prev,
          detalles: prev.detalles.map(d =>
            d.codigo === producto.codigo
              ? { ...d, cantidad: d.cantidad + 1 }
              : d
          )
        };
      } else {
        return {
          ...prev,
          detalles: [
            ...prev.detalles,
            {
              codigo: producto.codigo,
              descripcion: producto.descripcion,
              cantidad: 1,
              precioUnitario: producto.precio,
              stock: producto.stock || 0
            }
          ]
        };
      }
    });

    showTooltip(`✅ ${producto.descripcion} agregado`, 'success');
    setSugerenciasProductos([]);
  };

  // 📥 Manejo de entrada de código
  const [codigoInput, setCodigoInput] = useState('');

  const handleCodigoChange = (value) => {
    setCodigoInput(value);
    buscarProductos(value);
  };

  const handleCodigoSubmit = (e) => {
    e.preventDefault();
    if (codigoInput.trim()) {
      agregarProductoPorCodigo(codigoInput.trim());
      setCodigoInput('');
      if (codigoInputRef.current) {
        codigoInputRef.current.focus();
      }
    }
  };

  // Seleccionar producto de sugerencias
  const seleccionarProducto = (producto) => {
    agregarProductoPorCodigo(producto.codigo);
    setCodigoInput('');
    setSugerenciasProductos([]);
  };

  // ✏️ Editar detalle
  const handleDetalleChange = (index, field, value) => {
    setFactura(prev => {
      const nuevosDetalles = [...prev.detalles];
      if (field === 'cantidad' || field === 'precioUnitario') {
        value = parseFloat(value) || 0;
      }
      nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value };
      return { ...prev, detalles: nuevosDetalles };
    });
  };

  // Aumentar/disminuir cantidad
  const ajustarCantidad = (index, delta) => {
    setFactura(prev => {
      const nuevosDetalles = [...prev.detalles];
      const nuevaCantidad = Math.max(1, nuevosDetalles[index].cantidad + delta);
      nuevosDetalles[index] = { ...nuevosDetalles[index], cantidad: nuevaCantidad };
      return { ...prev, detalles: nuevosDetalles };
    });
  };

  const removeDetalle = (index) => {
    setFactura(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
    showTooltip('Producto eliminado de la factura', 'info');
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setFactura({
      rifReceptor: '',
      razonSocialReceptor: '',
      detalles: []
    });
    setCodigoInput('');
    showTooltip('Formulario limpiado', 'info');
    if (codigoInputRef.current) {
      codigoInputRef.current.focus();
    }
  };

  // Enviar factura
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!factura.rifReceptor || !factura.razonSocialReceptor) {
      showTooltip('⚠️ Complete los datos del cliente', 'error');
      rifReceptorRef.current?.focus();
      return;
    }

    if (factura.detalles.length === 0) {
      showTooltip('⚠️ Agregue al menos un producto', 'error');
      codigoInputRef.current?.focus();
      return;
    }

    // Validar cantidades positivas
    const productoInvalido = factura.detalles.find(d => d.cantidad <= 0 || d.precioUnitario < 0);
    if (productoInvalido) {
      showTooltip('⚠️ Revise cantidades y precios de los productos', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        rifReceptor: factura.rifReceptor,
        razonSocialReceptor: factura.razonSocialReceptor,
        detalles: factura.detalles.map(d => ({
          descripcion: `${d.descripcion} [${d.codigo}]`,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario
        }))
      };

      const res = await api.post('/facturas/insertar', payload);
      showTooltip(`✅ Factura #${res.data.numeroFactura} registrada exitosamente`, 'success');

      // Limpiar después del éxito
      setTimeout(() => {
        limpiarFormulario();
      }, 1500);

    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Error al registrar factura';
      showTooltip(`❌ ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cálculos
  const subtotal = factura.detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <div className="facturacion-container">
      <header className="facturacion-header">
        <h1 className="facturacion-title">
          <i className="icon-invoice"></i>
          Emitir Factura
        </h1>
        <div className="header-badge">
          <span className="badge-productos">{factura.detalles.length}</span>
          productos
        </div>
      </header>

      <Tooltip
        message={tooltip.message}
        type={tooltip.type}
        isVisible={tooltip.isVisible}
        onClose={closeTooltip}
      />

      <form onSubmit={handleSubmit} className="facturacion-form">
        {/* === Sección Cliente === */}
        <section className="form-section cliente-section">
          <div className="section-header">
            <i className="icon-user"></i>
            <h2>Datos del Cliente</h2>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="rifReceptor" className="form-label">
                <i className="icon-id"></i>
                RIF / Identificación
                <span className="required">*</span>
              </label>
              <div className="input-with-suggestions">
                <input
                  id="rifReceptor"
                  ref={rifReceptorRef}
                  type="text"
                  placeholder="Ej: J-12345678-9 o V12345678"
                  value={factura.rifReceptor}
                  onChange={(e) => handleIdentificacionChange(e.target.value)}
                  className="form-input"
                  required
                  disabled={loading}
                  autoComplete="off"
                />
                {buscandoCliente && (
                  <div className="loading-suggestions">
                    <div className="spinner"></div>
                  </div>
                )}
                {sugerenciasClientes.length > 0 && !buscandoCliente && (
                  <div className="suggestions-dropdown">
                    {sugerenciasClientes.map((cliente, idx) => (
                      <div
                        key={cliente.id || idx}
                        className="suggestion-item"
                        onClick={() => seleccionarCliente(cliente)}
                      >
                        <div className="suggestion-text">
                          <strong>{cliente.ci || cliente.rif}</strong>
                          <span>{cliente.nombre}</span>
                        </div>
                        <i className="icon-select"></i>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="razonSocialReceptor" className="form-label">
                <i className="icon-building"></i>
                Razón Social / Nombre
                <span className="required">*</span>
              </label>
              <input
                id="razonSocialReceptor"
                type="text"
                placeholder="Nombre completo del cliente"
                value={factura.razonSocialReceptor}
                onChange={(e) => setFactura({ ...factura, razonSocialReceptor: e.target.value })}
                className="form-input"
                required
                disabled={loading}
              />
            </div>
          </div>
        </section>

        {/* === Sección Productos === */}
        <section className="form-section productos-section">
          <div className="section-header">
            <i className="icon-barcode"></i>
            <h2>Agregar Productos</h2>
          </div>

          <div className="buscador-productos">
            <label className="form-label">
              <i className="icon-search"></i>
              Escanear o buscar producto
            </label>

            {/*   */}
            <div className="search-form">
              <div className="search-input-container">
                <input
                  ref={codigoInputRef}
                  type="text"
                  placeholder="Escanee el código o escriba para buscar..."
                  value={codigoInput}
                  onChange={(e) => handleCodigoChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCodigoSubmit(e);
                    }
                  }}
                  className="search-input"
                  disabled={loading}
                  autoComplete="off"
                />
                {/* ✅ Botón de tipo "button" */}
                <button
                  type="button"
                  onClick={handleCodigoSubmit}
                  className="search-button"
                  disabled={!codigoInput.trim()}
                >
                  <i className="icon-add"></i>
                </button>
              </div>

              {sugerenciasProductos.length > 0 && (
                <div className="productos-suggestions">
                  {sugerenciasProductos.map((producto, idx) => (
                    <div
                      key={idx}
                      className="producto-suggestion"
                      onClick={() => seleccionarProducto(producto)}
                    >
                      <div className="producto-info">
                        <span className="producto-codigo">{producto.codigo}</span>
                        <span className="producto-descripcion">{producto.descripcion}</span>
                      </div>
                      <div className="producto-precio">
                        ${producto.precio.toFixed(2)}
                        <i className="icon-arrow-right"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="help-text">
              <i className="icon-info"></i>
              Presione Enter para agregar o haga clic en una sugerencia
            </div>
          </div>

          {/* === Lista de Productos === */}
          <div className="detalles-section">
            <div className="detalles-header">
              <h3>Productos en la Factura ({factura.detalles.length})</h3>
              {factura.detalles.length > 0 && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="btn-limpiar"
                  disabled={loading}
                >
                  <i className="icon-clear"></i>
                  Limpiar Todo
                </button>
              )}
            </div>

            {factura.detalles.length === 0 ? (
              <div className="empty-state">
                <i className="icon-empty"></i>
                <p>No hay productos en la factura</p>
                <small>Escanea un producto o busca en la barra superior</small>
              </div>
            ) : (
              <div className="detalles-list">
                {factura.detalles.map((d, i) => (
                  <div key={i} className="detalle-item">
                    <div className="detalle-info">
                      <div className="detalle-header">
                        <span className="detalle-codigo">{d.codigo}</span>
                        {d.stock > 0 && (
                          <span className="stock-badge">
                            <i className="icon-stock"></i>
                            Stock: {d.stock}
                          </span>
                        )}
                      </div>
                      <p className="detalle-descripcion">{d.descripcion}</p>
                    </div>

                    <div className="detalle-controls">
                      <div className="cantidad-control">
                        <button
                          type="button"
                          onClick={() => ajustarCantidad(i, -1)}
                          className="cantidad-btn"
                          disabled={d.cantidad <= 1}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={d.cantidad}
                          onChange={(e) => handleDetalleChange(i, 'cantidad', e.target.value)}
                          min="1"
                          className="cantidad-input"
                        />
                        <button
                          type="button"
                          onClick={() => ajustarCantidad(i, 1)}
                          className="cantidad-btn"
                        >
                          +
                        </button>
                      </div>

                      <div className="precio-control">
                        <label>Precio Unitario</label>
                        <div className="precio-input-container">
                          <span className="currency-symbol">$</span>
                          <input
                            type="number"
                            value={d.precioUnitario}
                            onChange={(e) => handleDetalleChange(i, 'precioUnitario', e.target.value)}
                            min="0"
                            step="0.01"
                            className="precio-input"
                          />
                        </div>
                      </div>

                      <div className="detalle-total">
                        <label>Total</label>
                        <div className="total-amount">
                          ${(d.cantidad * d.precioUnitario).toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeDetalle(i)}
                        className="btn-remove"
                        title="Eliminar producto"
                      >
                        <i className="icon-close"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* === Resumen y Totales === */}
        <section className="form-section resumen-section">
          <div className="section-header">
            <i className="icon-calculator"></i>
            <h2>Resumen de Factura</h2>
          </div>

          <div className="resumen-grid">
            <div className="resumen-item">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="resumen-item">
              <span>IVA (16%):</span>
              <span>${iva.toFixed(2)}</span>
            </div>
            <div className="resumen-item destacado">
              <span>Total a Pagar:</span>
              <span className="total-grande">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="resumen-estadisticas">
            <div className="estadistica">
              <i className="icon-box"></i>
              <span>{factura.detalles.length} productos</span>
            </div>
            <div className="estadistica">
              <i className="icon-units"></i>
              <span>{factura.detalles.reduce((sum, d) => sum + d.cantidad, 0)} unidades</span>
            </div>
          </div>
        </section>

        {/* === Acciones === */}
        <div className="form-actions">
          <button
            type="button"
            onClick={limpiarFormulario}
            className="btn-secondary"
            disabled={loading || factura.detalles.length === 0}
          >
            <i className="icon-clear"></i>
            Cancelar
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || factura.detalles.length === 0}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Procesando...
              </>
            ) : (
              <>
                <i className="icon-check"></i>
                Registrar Factura
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
