// src/hooks/useInitializeDB.js
import { useEffect } from 'react';
import { db } from '../db/db';

// ⚠️ Cambia esto a `true` para forzar reinicio (luego vuelve a `false`)
const FORCE_REINITIALIZE = false;

export const useInitializeDB = () => {
  useEffect(() => {
    const initializeDB = async () => {
      // 🔁 Si queremos forzar reinicio, ignoramos la bandera
      const alreadyInitialized = localStorage.getItem('facdin_db_initialized');
      if (alreadyInitialized && !FORCE_REINITIALIZE) {
        return;
      }

      try {
        console.log('🗑️  Limpiando base de datos existente...');
        await db.clientes.clear();
        await db.productos.clear();

        console.log('🌱 Insertando nuevos datos de prueba...');

        // === Clientes de prueba (15) ===
        const clientes = [
          { ci: 'V12345678', nombre: 'Juan Pérez', telefono: '0412-1234567', direccion: 'Av. Principal, Caracas' },
          { ci: 'V23456789', nombre: 'María González', telefono: '0414-2345678', direccion: 'Calle 5, Maracaibo' },
          { rif: 'J-12345678-9', nombre: 'Comercio XYZ C.A.', telefono: '0212-3456789', direccion: 'Zona Industrial, Valencia' },
          { ci: 'E87654321', nombre: 'Carlos López', telefono: '0424-8765432', direccion: 'Urb. El Rosal, Caracas' },
          { rif: 'G-23456789-0', nombre: 'Distribuidora Andina Ltda.', telefono: '0274-5551234', direccion: 'Mérida' },
          { ci: 'V34567890', nombre: 'Ana Martínez', telefono: '0416-3456789', direccion: 'Barquisimeto' },
          { ci: 'V45678901', nombre: 'Luis Rodríguez', telefono: '0426-4567890', direccion: 'San Cristóbal' },
          { rif: 'J-34567890-1', nombre: 'Tech Solutions C.A.', telefono: '0212-9876543', direccion: 'Chacao, Caracas' },
          { ci: 'V56789012', nombre: 'Sofía Ramírez', telefono: '0412-5678901', direccion: 'Los Teques' },
          { ci: 'V67890123', nombre: 'Diego Fernández', telefono: '0414-6789012', direccion: 'Guarenas' },
          { rif: 'J-45678901-2', nombre: 'Importadora Global C.A.', telefono: '0234-2223333', direccion: 'Puerto Ordaz' },
          { ci: 'E11223344', nombre: 'Laura Torres', telefono: '0424-1122334', direccion: 'Maturín' },
          { ci: 'V78901234', nombre: 'Andrés Silva', telefono: '0416-7890123', direccion: 'Cumaná' },
          { rif: 'G-56789012-3', nombre: 'Agricultores Unidos C.A.', telefono: '0275-7778888', direccion: 'San Fernando de Apure' },
          { ci: 'V89012345', nombre: 'Camila Herrera', telefono: '0412-8901234', direccion: 'Petare, Caracas' }
        ];

        for (const c of clientes) {
          const id = c.ci ? c.ci : c.rif;
          await db.clientes.put({
            id,
            ci: c.ci || null,
            rif: c.rif || null,
            nombre: c.nombre,
            telefono: c.telefono,
            direccion: c.direccion
          });
        }

        // === Productos de prueba (50) ===
        const nombresProductos = [
          'Arroz Premium 1kg', 'Pasta Tricolor 500g', 'Aceite Vegetal 900ml',
          'Azúcar Morena 1kg', 'Harina de Trigo 1kg', 'Leche Entera 1L',
          'Atún en Lata 185g', 'Sardinas en Aceite 150g', 'Café Molido 250g',
          'Galletas Rellenas 200g', 'Jabón de Tocador 90g', 'Detergente Líquido 1L',
          'Shampoo AntiCaspa 400ml', 'Papel Higiénico 4 rollos', 'Agua Mineral 1.5L',
          'Gaseosa Cola 2L', 'Cerveza Premium 355ml', 'Ron Añejo 750ml',
          'Pan Blanco por unidad', 'Queso Guayanés 500g', 'Mantequilla 250g',
          'Huevos por docena', 'Pollo Entero 2kg', 'Carne Molida 1kg',
          'Pescado Entero 1.5kg', 'Tomate por kg', 'Cebolla por kg',
          'Papa Blanca 1kg', 'Plátano Maduro 1kg', 'Manzana Roja 1kg',
          'Naranja de Mesa 1kg', 'Banano 1kg', 'Lechuga 1 unidad',
          'Zanahoria 1kg', 'Ajo por cabeza', 'Cilantro por manojo',
          'Detergente en Polvo 1kg', 'Suavizante 1L', 'Cloro 1L',
          'Esponja de Acero', 'Bolsas de Basura 30 unidades', 'Fósforos Caja',
          'Velas Blancas 10 unidades', 'Pilas AA 4 unidades', 'Linternas LED',
          'Cepillo Dental', 'Pasta Dental 100g', 'Desodorante Roll-On 100ml',
          'Crema Hidratante 200ml', 'Protector Solar FPS 50'
        ];

        for (let i = 0; i < nombresProductos.length; i++) {
          const nombre = nombresProductos[i];
          const codigo = String(i + 1).padStart(3, '0'); // ✅ 001, 002, etc.
          const id = codigo;
          await db.productos.put({
            id,
            codigo,
            descripcion: nombre,
            precio: parseFloat((10 + Math.random() * 490).toFixed(2)),
            cantidad: Math.floor(Math.random() * 100) + 1,
            estatus: Math.random() < 0.25 ? 'bloq' : 'vig'
          });
        }

        // ✅ Marcar como inicializado (solo si no estamos forzando)
        if (!FORCE_REINITIALIZE) {
          localStorage.setItem('facdin_db_initialized', 'true');
        }
        console.log('✅ Base de datos local reiniciada con nuevos datos de prueba.');
      } catch (err) {
        console.error('❌ Error al reiniciar la base de datos:', err);
      }
    };

    initializeDB();
  }, []);
};
