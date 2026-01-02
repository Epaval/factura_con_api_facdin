// src/components/GestionClientes.jsx
import { useState, useEffect } from 'react';
import {
  obtenerTodosClientes,
  guardarCliente,
  eliminarCliente
} from '../services/localDB';

export default function GestionClientes() {
  const [todosClientes, setTodosClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 10;

  const [formulario, setFormulario] = useState({
    id: null,
    identificacion: '',
    nombre: '',
    telefono: '',
    direccion: ''
  });
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  // Cargar todos los clientes
  const cargarClientes = async () => {
    const data = await obtenerTodosClientes();
    setTodosClientes(data);
    setClientesFiltrados(data);
    setPaginaActual(1); // Reiniciar a la primera página
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Filtrar clientes cuando cambia la búsqueda
  useEffect(() => {
    const texto = busqueda.toLowerCase().trim();
    let filtrados = todosClientes;

    if (texto) {
      filtrados = todosClientes.filter(cliente =>
        (cliente.ci && cliente.ci.toLowerCase().includes(texto)) ||
        (cliente.rif && cliente.rif.toLowerCase().includes(texto)) ||
        (cliente.nombre && cliente.nombre.toLowerCase().includes(texto))
      );
    }

    setClientesFiltrados(filtrados);
    setPaginaActual(1); // Reiniciar a página 1 al buscar
  }, [busqueda, todosClientes]);

  // Calcular clientes para la página actual
  const indiceUltimo = paginaActual * clientesPorPagina;
  const indicePrimero = indiceUltimo - clientesPorPagina;
  const clientesPaginados = clientesFiltrados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formulario.identificacion.trim() || !formulario.nombre.trim()) {
      setMensaje({ text: 'CI/RIF y nombre son obligatorios', type: 'error' });
      return;
    }

    const identificacion = formulario.identificacion.toUpperCase();
    let ci = null, rif = null;
    if (identificacion.startsWith('V') || identificacion.startsWith('E')) {
      ci = identificacion;
    } else {
      rif = identificacion;
    }

    await guardarCliente({
      id: formulario.id,
      ci,
      rif,
      nombre: formulario.nombre,
      telefono: formulario.telefono,
      direccion: formulario.direccion
    });

    setMensaje({ text: 'Cliente guardado', type: 'success' });
    setFormulario({ id: null, identificacion: '', nombre: '', telefono: '', direccion: '' });
    cargarClientes();
    setTimeout(() => setMensaje({ text: '', type: '' }), 3000);
  };

  const editarCliente = (cliente) => {
    const identificacion = cliente.ci || cliente.rif;
    setFormulario({
      id: cliente.id,
      identificacion,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      direccion: cliente.direccion
    });
  };

  const borrarCliente = async (id) => {
    if (window.confirm('¿Eliminar cliente?')) {
      await eliminarCliente(id);
      cargarClientes();
    }
  };

  const cambiarPagina = (numero) => {
    setPaginaActual(numero);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Gestión de Clientes</h2>

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
        <h3>{formulario.id ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="CI (V12345678) o RIF (J-12345678-9)"
            value={formulario.identificacion}
            onChange={(e) => setFormulario({ ...formulario, identificacion: e.target.value })}
            required
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <input
            type="text"
            placeholder="Nombre completo"
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
            required
            style={{ padding: '8px', fontSize: '14px' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Teléfono"
            value={formulario.telefono}
            onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
            style={{ padding: '8px', fontSize: '14px' }}
          />
          <input
            type="text"
            placeholder="Dirección"
            value={formulario.direccion}
            onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
            style={{ padding: '8px', fontSize: '14px' }}
          />
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
            onClick={() => setFormulario({ id: null, identificacion: '', nombre: '', telefono: '', direccion: '' })}
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
          placeholder="Buscar por CI, RIF o nombre..."
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
        <h3>Lista de Clientes ({clientesFiltrados.length})</h3>
        {clientesFiltrados.length === 0 ? (
          <p>No se encontraron clientes.</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>CI / RIF</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Nombre</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Teléfono</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesPaginados.map(cliente => (
                  <tr key={cliente.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{cliente.id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{cliente.ci || cliente.rif}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{cliente.nombre}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{cliente.telefono}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <button
                        onClick={() => editarCliente(cliente)}
                        style={{ marginRight: '6px', padding: '4px 8px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '3px' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => borrarCliente(cliente.id)}
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
