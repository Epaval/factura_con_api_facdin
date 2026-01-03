// src/services/reportesLocalDB.js
import { db } from '../db/db';

/**
 * Obtiene un resumen de ventas por método de pago para un día específico
 * @param {string} fechaISO - Fecha en formato 'YYYY-MM-DD'
 * @returns {Object} { totalGeneral, porMetodo, facturas }
 */
export const obtenerReporteDiario = async (fechaISO) => {
  // Obtener todos los pagos del día
  const pagosDelDia = await db.pagos
    .filter(pago => {
      const fechaPago = pago.fecha.split('T')[0]; // Extraer YYYY-MM-DD
      return fechaPago === fechaISO;
    })
    .toArray();

  if (pagosDelDia.length === 0) {
    return {
      totalGeneral: 0,
      porMetodo: {},
      facturas: []
    };
  }

  // Agrupar por método de pago
  const porMetodo = {};
  let totalGeneral = 0;
  const facturas = [];

  for (const pago of pagosDelDia) {
    const detalles = JSON.parse(pago.pagosJson);
    facturas.push({
      numeroFactura: pago.numeroFactura,
      fecha: pago.fecha,
      pagos: detalles,
      vuelto: pago.vuelto || 0
    });

    for (const item of detalles) {
      const tipo = item.tipo;
      const monto = parseFloat(item.monto) || 0;
      
      if (!porMetodo[tipo]) {
        porMetodo[tipo] = { total: 0, cantidad: 0 };
      }
      
      porMetodo[tipo].total += monto;
      porMetodo[tipo].cantidad += 1;
      totalGeneral += monto;
    }
  }

  return {
    totalGeneral,
    porMetodo,
    facturas: facturas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  };
};