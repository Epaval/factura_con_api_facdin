// src/db/db.js
import Dexie from 'dexie';

const db = new Dexie('FacdinLocalDB');

// Definir esquema
db.version(1).stores({
  clientes: '&id, ci, rif, nombre', // &id = primary key auto
  productos: '&id, codigo, descripcion, estatus' // índice en codigo, descripcion, estatus
});

// Tipos opcionales (TypeScript-style en JS puro)
export class Cliente {
  constructor(id, identificacion, nombre, telefono, direccion) {
    this.id = id;
    if (identificacion.startsWith('V') || identificacion.startsWith('E')) {
      this.ci = identificacion;
      this.rif = null;
    } else {
      this.rif = identificacion;
      this.ci = null;
    }
    this.nombre = nombre;
    this.telefono = telefono;
    this.direccion = direccion;
  }
}

export class Producto {
  constructor(id, codigo, descripcion, precio, cantidad, estatus = 'vig') {
    this.id = id;
    this.codigo = codigo;
    this.descripcion = descripcion;
    this.precio = precio; // número
    this.cantidad = cantidad; // número
    this.estatus = estatus; // 'vig' o 'bloq'
  }
}

export { db };