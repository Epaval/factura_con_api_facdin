// src/components/GestionProductos.jsx
import { useState, useEffect } from 'react';
import {
  obtenerProductos,
  guardarProducto,
  eliminarProducto
} from '../services/localDB';

export default function GestionProductos() {
  const [todosProductos, setTodosProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;

  const [formulario, setFormulario] = useState({
    id: null,
    codigo: '',
    descripcion: '',
    precio: '',
    cantidad: '',
    estatus: 'vig'
  });
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  // Cargar todos los productos
  const cargarProductos = async () => {
    const data = await obtenerProductos();
    setTodosProductos(data);
    setProductosFiltrados(data);
    setPaginaActual(1); // Reiniciar a la primera página al recargar
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    const texto = busqueda.toLowerCase().trim();
    let filtrados = todosProductos;

    if (texto) {
      filtrados = todosProductos.filter(producto =>
        producto.codigo.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto)
      );
    }

    setProductosFiltrados(filtrados);
    setPaginaActual(1); // Reiniciar a página 1 al buscar
  }, [busqueda, todosProductos]);

  // Calcular productos para la página actual
  const indiceUltimo = paginaActual * productosPorPagina;
  const indicePrimero = indiceUltimo - productosPorPagina;
  const productosPaginados = productosFiltrados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formulario.codigo.trim() || !formulario.descripcion.trim()) {
      setMensaje({ text: 'Código y descripción son obligatorios', type: 'error' });
      return;
    }

    await guardarProducto({
      id: formulario.id,
      codigo: formulario.codigo,
      descripcion: formulario.descripcion,
      precio: parseFloat(formulario.precio) || 0,
      cantidad: parseInt(formulario.cantidad) || 0,
      estatus: formulario.estatus
    });

    setMensaje({ text: 'Producto guardado', type: 'success' });
    setFormulario({ id: null, codigo: '', descripcion: '', precio: '', cantidad: '', estatus: 'vig' });
    cargarProductos();
    setTimeout(() => setMensaje({ text: '', type: '' }), 3000);
  };

  const editarProducto = (producto) => {
    setFormulario({
      id: producto.id,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      precio: producto.precio.toString(),
      cantidad: producto.cantidad.toString(),
      estatus: producto.estatus
    });
  };

  const borrarProducto = async (id) => {
    if (window.confirm('¿Eliminar producto?')) {
      await eliminarProducto(id);
      cargarProductos();
    }
  };

  const cambiarPagina = (numero) => {
    setPaginaActual(numero);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestión de Productos</h2>

      {mensaje.text && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          backgroundColor: mensaje.type === 'error' ? '#ffebee' : '#e8f5e9',
          color: mensaje.type === 'error' ? '#c62828' : '#2e7d32',
          borderRadius: '4px'
        }}>
          {mensaje.text}
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '6px' }}>
        <h3>{formulario.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Código"
            value={formulario.codigo}
            onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value })}
            required
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <input
            type="text"
            placeholder="Descripción"
            value={formulario.descripcion}
            onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
            required
            style={{ padding: '8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Precio"
            value={formulario.precio}
            onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })}
            step="0.01"
            min="0"
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <input
            type="number"
            placeholder="Cantidad"
            value={formulario.cantidad}
            onChange={(e) => setFormulario({ ...formulario, cantidad: e.target.value })}
            min="0"
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <select
            value={formulario.estatus}
            onChange={(e) => setFormulario({ ...formulario, estatus: e.target.value })}
            style={{ padding: '8px', fontSize: '14px' }}
          >
            <option value="vig">Vigente</option>
            <option value="bloq">Bloqueado</option>
          </select>
        </div>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {formulario.id ? 'Actualizar' : 'Guardar'}
        </button>
        {formulario.id && (
          <button
            type="button"
            onClick={() => setFormulario({ id: null, codigo: '', descripcion: '', precio: '', cantidad: '', estatus: 'vig' })}
            style={{
              padding: '8px 16px',
              marginLeft: '8px',
              backgroundColor: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      {/* Buscador */}
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* Tabla */}
      <div>
        <h3>Lista de Productos ({productosFiltrados.length})</h3>
        {productosFiltrados.length === 0 ? (
          <p>No se encontraron productos.</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Código</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Descripción</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Precio</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Stock</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Estatus</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPaginados.map(producto => (
                  <tr key={producto.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{producto.codigo}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{producto.descripcion}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Bs. {producto.precio.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{producto.cantidad}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <span style={{ color: producto.estatus === 'vig' ? 'green' : 'red' }}>
                        {producto.estatus === 'vig' ? 'Vigente' : 'Bloqueado'}
                      </span>
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <button
                        onClick={() => editarProducto(producto)}
                        style={{ marginRight: '6px', padding: '4px 8px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '3px' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => borrarProducto(producto.id)}
                        style={{ padding: '4px 8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginador */}
            {totalPaginas > 1 && (
              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: paginaActual === 1 ? '#e0e0e0' : '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: paginaActual === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Anterior
                </button>

                {[...Array(totalPaginas)].map((_, i) => {
                  const num = i + 1;
                  return (
                    <button
                      key={num}
                      onClick={() => cambiarPagina(num)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: paginaActual === num ? '#1976d2' : '#e0e0e0',
                        color: paginaActual === num ? 'white' : 'black',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {num}
                    </button>
                  );
                })}

                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: paginaActual === totalPaginas ? '#e0e0e0' : '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer'
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
