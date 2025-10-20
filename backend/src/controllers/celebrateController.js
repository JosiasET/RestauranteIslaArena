// src/controllers/celebrateController.js
const db = require("../config/database");

const celebrateController = {
  crearCelebracion: async (req, res) => {
    try {
      console.log('📥 Datos recibidos:', req.body);
      
      const { 
        nombre_completo, 
        fecha_nacimiento, 
        telefono, 
        fecha_preferida, 
        hora_preferida, 
        acepta_verificacion,
        reservation,
        cant_people 
      } = req.body;

      // Validaciones básicas
      if (!nombre_completo || !fecha_nacimiento || !telefono || !fecha_preferida || !hora_preferida) {
        return res.status(400).json({ 
          error: "Todos los campos son requeridos",
          campos_recibidos: req.body 
        });
      }

      const result = await db.query(
        `INSERT INTO celebrate 
          (nombre_completo, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, 
           acepta_verificacion, reservation, cant_people, ine_verificacion, estado_verificacion) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          nombre_completo, 
          fecha_nacimiento, 
          telefono, 
          fecha_preferida, 
          hora_preferida, 
          acepta_verificacion || false,
          reservation || 'CEL' + Math.random().toString(36).substr(2, 8).toUpperCase(),
          cant_people || 1,
          false, // ine_verificacion por defecto
          false  // estado_verificacion por defecto
        ]
      );

      console.log('✅ Celebración guardada:', result.rows[0]);
      
      res.json({ 
        message: "✅ Celebración guardada", 
        data: result.rows[0] 
      });
    } catch (err) {
      console.error('❌ Error en crearCelebracion:', err);
      res.status(500).json({ 
        error: "Error al guardar la celebración",
        detalle: err.message,
        stack: err.stack
      });
    }
  },

  obtenerCelebraciones: async (req, res) => {
    try {
      console.log('📋 Solicitando todas las celebraciones');
      
      const result = await db.query(
        "SELECT * FROM celebrate ORDER BY id_celebracion DESC"
      );
      
      console.log(`✅ ${result.rows.length} celebraciones encontradas`);
      
      res.json(result.rows);
    } catch (err) {
      console.error('❌ Error en obtenerCelebraciones:', err);
      res.status(500).json({ 
        error: "Error al obtener celebraciones",
        detalle: err.message,
        stack: err.stack
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