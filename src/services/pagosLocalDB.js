// src/services/pagosLocalDB.js
import { db } from '../db/db';

/**
 * Guarda los métodos de pago asociados a una factura
 * @param {string} numeroFactura - Número de la factura registrada en Facdin
 * @param {Array} pagos - Array de objetos de pago [{ tipo, monto, referencia }]
 * @param {number} vuelto - Vuelto entregado (0 si no aplica)
 */
export const guardarPago = async (numeroFactura, pagos, vuelto = 0) => {
  const id = `pago_${numeroFactura}_${Date.now()}`;
  await db.pagos.put({
    id,
    facturaId: null, // opcional si usas ID interno
    numeroFactura,
    fecha: new Date().toISOString(),
    pagosJson: JSON.stringify(pagos),
    vuelto
  });
};

/**
 * Obtiene los pagos asociados a una factura
 * @param {string} numeroFactura 
 * @returns {Object|null} { pagos: [...], vuelto: number } o null
 */
export const obtenerPagoPorFactura = async (numeroFactura) => {
  const pago = await db.pagos
    .where('numeroFactura')
    .equals(numeroFactura)
    .first();

  if (!pago) return null;

  return {
    pagos: JSON.parse(pago.pagosJson),
    vuelto: pago.vuelto || 0,
    fecha: pago.fecha
  };
};

/**
 * (Opcional) Eliminar pagos si se anula una factura
 */
export const eliminarPagoPorFactura = async (numeroFactura) => {
  await db.pagos.where('numeroFactura').equals(numeroFactura).delete();
};