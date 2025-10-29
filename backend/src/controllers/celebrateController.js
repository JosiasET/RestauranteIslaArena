// src/controllers/celebrateController.js
const db = require("../config/database");

const celebrateController = {
  // En celebrateController.js - modifica crearCelebracion
crearCelebracion: async (req, res) => {
  try {
    console.log('📥 Datos recibidos en backend:', req.body);
    
    const { 
      nombre_completo, 
      fecha_nacimiento, 
      telefono, 
      fecha_preferida, 
      hora_preferida, 
      acepta_verificacion,
      cant_people 
    } = req.body;

    // Validaciones básicas
    if (!nombre_completo || !fecha_nacimiento || !telefono || !fecha_preferida || !hora_preferida) {
      console.log('❌ Campos faltantes:', req.body);
      return res.status(400).json({ 
        error: "Todos los campos son requeridos",
        campos_recibidos: req.body 
      });
    }

    if (cant_people > 10) {
      console.log('❌ Demasiadas personas:', cant_people);
      return res.status(400).json({ 
        error: "Máximo 10 personas por reservación"
      });
    }

    console.log('🔍 Llamando a función PostgreSQL...');
    
    // USAR LA FUNCIÓN DE POSTGRESQL CON VALIDACIÓN
    const result = await db.query(
      `SELECT crear_reserva_celebrate($1, $2, $3, $4, $5, $6, $7) as resultado`,
      [
        nombre_completo, 
        fecha_nacimiento, 
        telefono, 
        fecha_preferida, 
        hora_preferida, 
        cant_people || 1,
        acepta_verificacion || false
      ]
    );

    console.log('📊 Resultado de PostgreSQL:', result.rows[0].resultado);

    const resultado = result.rows[0].resultado;
    
    if (resultado.success) {
      console.log('✅ Reserva creada con validación:', resultado);
      res.json({ 
        message: resultado.message, 
        data: {
          id_celebracion: resultado.reserva_id,
          reservation: resultado.codigo_reserva,
          capacidad_restante: resultado.capacidad_restante,
          nombre_completo: nombre_completo,
          fecha_preferida: fecha_preferida,
          hora_preferida: hora_preferida,
          cant_people: cant_people || 1
        }
      });
    } else {
      console.log('❌ Capacidad insuficiente:', resultado.message);
      res.status(400).json({ 
        error: resultado.message,
        capacidad_restante: resultado.capacidad_restante
      });
    }
    
  } catch (err) {
    console.error('❌ Error en crearCelebracion:', err);
    console.error('❌ Stack trace:', err.stack);
    res.status(500).json({ 
      error: "Error al guardar la celebración",
      detalle: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
},

  obtenerCelebraciones: async (req, res) => {
    try {
      console.log('📋 Solicitando todas las celebraciones');
      
      const result = await db.query(
        `SELECT * FROM celebrate ORDER BY fecha_creacion DESC`
      );
      
      console.log(`✅ ${result.rows.length} celebraciones encontradas`);
      res.json(result.rows);
    } catch (err) {
      console.error('❌ Error en obtenerCelebraciones:', err);
      res.status(500).json({ 
        error: "Error al obtener celebraciones",
        detalle: err.message
      });
    }
  },

  verificarDisponibilidad: async (req, res) => {
    try {
      const { fecha_preferida, hora_preferida, cant_people } = req.body;
      
      if (!fecha_preferida || !hora_preferida) {
        return res.status(400).json({ error: "Fecha y hora requeridas" });
      }

      const result = await db.query(
        `SELECT verificar_disponibilidad_celebrate($1, $2, $3) as resultado`,
        [fecha_preferida, hora_preferida, cant_people || 1]
      );

      res.json(result.rows[0].resultado);
    } catch (err) {
      console.error('❌ Error verificando disponibilidad:', err);
      res.status(500).json({ 
        error: "Error al verificar disponibilidad",
        detalle: err.message
      });
    }
  },

  actualizarVerificacion: async (req, res) => {
    try {
      const { id } = req.params;
      const { ine_verificacion, estado_verificacion } = req.body;

      console.log(`🔄 Actualizando verificación ID: ${id}`, req.body);

      const result = await db.query(
        `UPDATE celebrate 
         SET ine_verificacion = $1, estado_verificacion = $2 
         WHERE id_celebracion = $3 
         RETURNING *`,
        [ine_verificacion, estado_verificacion, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Celebración no encontrada" });
      }

      console.log('✅ Verificación actualizada:', result.rows[0]);
      res.json({ 
        message: "✅ Verificación actualizada", 
        data: result.rows[0] 
      });
    } catch (err) {
      console.error('❌ Error en actualizarVerificacion:', err);
      res.status(500).json({ 
        error: "Error al actualizar verificación",
        detalle: err.message
      });
    }
  },

  eliminarCelebracion: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Eliminando celebración ID: ${id}`);

      const result = await db.query(
        'DELETE FROM celebrate WHERE id_celebracion = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Celebración no encontrada" });
      }

      console.log('✅ Celebración eliminada:', result.rows[0]);
      res.json({ 
        message: "✅ Celebración eliminada", 
        data: result.rows[0] 
      });
    } catch (err) {
      console.error('❌ Error en eliminarCelebracion:', err);
      res.status(500).json({ 
        error: "Error al eliminar celebración",
        detalle: err.message
      });
    }
  }
};

module.exports = celebrateController;