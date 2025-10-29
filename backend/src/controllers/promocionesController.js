const db = require("../config/database");

// Normalizar los nombres de los campos
function normalizarCelebraciones(rows) {
  return rows.map((c) => ({
    id_celebracion: c.id_celebracion,
    nombre_completo: c.nombre_completo,
    fecha_nacimiento: c.fecha_nacimiento,
    telefono: c.telefono,
    fecha_preferida: c.fecha_preferida,
    hora_preferida: c.hora_preferida,
    acepta_verificacion: c.acepta_verificacion,
    reservation: c.reservation,
    cant_people: c.cant_people,
    ine_verificacion: c.ine_verificacion,
    estado_verificacion: c.estado_verificacion,
    created_at: c.created_at
  }));
}

const celebrateController = {
  // Crear nueva celebración
  crearCelebracion: async (req, res) => {
    try {
      const { 
        nombre_completo, 
        fecha_nacimiento, 
        telefono, 
        fecha_preferida, 
        hora_preferida, 
        acepta_verificacion,
        reservation,
        cant_people,
        ine_verificacion,
        estado_verificacion
      } = req.body;

      if (!nombre_completo || !fecha_nacimiento || !telefono || !fecha_preferida || !hora_preferida) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      const result = await db.query(
        `INSERT INTO celebrate (
          nombre_completo, fecha_nacimiento, telefono, fecha_preferida, 
          hora_preferida, acepta_verificacion, reservation, cant_people,
          ine_verificacion, estado_verificacion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          nombre_completo, 
          fecha_nacimiento, 
          telefono, 
          fecha_preferida, 
          hora_preferida, 
          acepta_verificacion || false,
          reservation || null,
          cant_people || 1,
          ine_verificacion || false,
          estado_verificacion || false
        ]
      );

      res.json({
        message: "🎉 Registro guardado correctamente",
        data: normalizarCelebraciones(result.rows)[0],
      });
    } catch (err) {
      console.error("❌ Error al crear celebración:", err);
      res.status(500).json({ error: "Error al registrar la celebración" });
    }
  },

  // Obtener todas las celebraciones
  obtenerCelebraciones: async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM celebrate ORDER BY id_celebracion DESC");
      res.json(normalizarCelebraciones(result.rows));
    } catch (err) {
      console.error("❌ Error al obtener celebraciones:", err);
      res.status(500).json({ error: "Error al obtener las celebraciones" });
    }
  },

  // Actualizar verificación (INE y estado)
  actualizarVerificacion: async (req, res) => {
    try {
      const { id } = req.params;
      const { ine_verificacion, estado_verificacion } = req.body;

      if (ine_verificacion === undefined && estado_verificacion === undefined) {
        return res.status(400).json({ error: "Se requiere al menos un campo para actualizar" });
      }

      let updateFields = [];
      let values = [];
      let paramCount = 1;

      if (ine_verificacion !== undefined) {
        updateFields.push(`ine_verificacion = $${paramCount}`);
        values.push(ine_verificacion);
        paramCount++;
      }

      if (estado_verificacion !== undefined) {
        updateFields.push(`estado_verificacion = $${paramCount}`);
        values.push(estado_verificacion);
        paramCount++;
      }

      values.push(id);

      const query = `
        UPDATE celebrate 
        SET ${updateFields.join(', ')} 
        WHERE id_celebracion = $${paramCount} 
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Celebración no encontrada" });
      }

      res.json({
        message: "✅ Verificación actualizada correctamente",
        data: normalizarCelebraciones(result.rows)[0]
      });
    } catch (err) {
      console.error("❌ Error al actualizar verificación:", err);
      res.status(500).json({ error: "Error al actualizar la verificación" });
    }
  },

  // Eliminar celebración
  eliminarCelebracion: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query(
        "DELETE FROM celebrate WHERE id_celebracion = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Celebración no encontrada" });
      }

      res.json({
        message: "🗑️ Celebración eliminada correctamente",
        data: normalizarCelebraciones(result.rows)[0]
      });
    } catch (err) {
      console.error("❌ Error al eliminar celebración:", err);
      res.status(500).json({ error: "Error al eliminar la celebración" });
    }
  },

  // Obtener celebraciones por fecha (para capacidad)
  obtenerCelebracionesPorFecha: async (req, res) => {
    try {
      const { fecha } = req.query;
      
      if (!fecha) {
        return res.status(400).json({ error: "La fecha es requerida" });
      }

      const result = await db.query(
        "SELECT * FROM celebrate WHERE fecha_preferida = $1 ORDER BY hora_preferida",
        [fecha]
      );

      res.json(normalizarCelebraciones(result.rows));
    } catch (err) {
      console.error("❌ Error al obtener celebraciones por fecha:", err);
      res.status(500).json({ error: "Error al obtener las celebraciones" });
    }
  }
};

module.exports = celebrateController;