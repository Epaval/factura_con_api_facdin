// src/services/facturasApi.js
import { api } from './api';

/**
 * Obtiene las facturas recientes asociadas a la apiKey actual
 * @returns {Promise<Array>} Lista de facturas recientes
 */
export const obtenerFacturasRecientes = async () => {
  const response = await api.get('/facturas/recientes');
  return response.data.data; // Ajusta si tu API envía { facturas: [...] }
};

/**
 * Obtiene el detalle completo de una factura por su ID
 * @param {string|number} facturaId 
 * @returns {Promise<Object>} Detalle de la factura
 */
 // src/services/facturasApi.js
export const obtenerDetalleFactura = async (facturaId) => {
  const response = await api.get(`/facturas/detalle/${facturaId}`);
  const { factura, detalles, notas } = response.data;
  
  // Combina todo en un solo objeto para el frontend
  return {
    ...factura,
    detalles: detalles || [],
    notas: notas || []
  };
};

/**
 * Verifica una factura por su número (usualmente para público, pero protegido por apiKey en tu caso)
 * @param {string} numeroFactura 
 * @returns {Promise<Object>} Datos de la factura
 */
export const verificarFacturaPorNumero = async (numeroFactura) => {
  const response = await api.get(`/facturas/${numeroFactura}`);
  return response.data;
}; 