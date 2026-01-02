 // src/services/localDB.js
import { db } from '../db/db';

// === CLIENTES ===

/**
 * Busca un cliente EXACTO por identificación (CI o RIF)
 */
export const buscarClientePorIdentificacion = async (identificacion) => {
  if (!identificacion) return null;
  const id = identificacion.toUpperCase().trim();
  if (id.startsWith('V') || id.startsWith('E')) {
    return await db.clientes.where('ci').equals(id).first();
  }
  return await db.clientes.where('rif').equals(id).first();
};

/**
 * Guarda un cliente asegurando que CI/RIF estén en mayúsculas
 */
export const guardarCliente = async (cliente) => {
  const id = cliente.id || Date.now();
  
  let ci = null;
  let rif = null;

  if (cliente.ci) {
    ci = cliente.ci.toUpperCase().trim();
  }
  if (cliente.rif) {
    rif = cliente.rif.toUpperCase().trim();
  }

  await db.clientes.put({
    ...cliente,
    id,
    ci,
    rif,
    nombre: cliente.nombre?.trim()
  });
};

/**
 * Busca clientes por término (CI, RIF o nombre) — sensible a mayúsculas
 */
export const buscarClientes = async (termino) => {
  if (!termino || termino.length < 2) return [];

  const term = termino.toUpperCase().trim(); // ✅ USAR MAYÚSCULAS

  return await db.clientes
    .filter(cliente =>
      (cliente.ci && cliente.ci.includes(term)) ||
      (cliente.rif && cliente.rif.includes(term)) ||
      (cliente.nombre && cliente.nombre.toUpperCase().includes(term))
    )
    .toArray();
};

export const obtenerTodosClientes = async () => {
  return await db.clientes.toArray();
};

export const eliminarCliente = async (id) => {
  await db.clientes.delete(id);
};

// === PRODUCTOS ===
export const obtenerProductos = async (soloVigentes = false) => {
  let query = db.productos.toCollection();
  if (soloVigentes) {
    query = query.filter(p => p.estatus === 'vig');
  }
  return await query.toArray();
};

export const guardarProducto = async (producto) => {
  const id = producto.id || Date.now();
  await db.productos.put({ ...producto, id });
};

export const eliminarProducto = async (id) => {
  await db.productos.delete(id);
};