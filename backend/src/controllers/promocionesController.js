const db = require("../config/database");

// Normalizar los nombres de los campos
function normalizarCelebraciones(rows) {
  return rows.map((c) => ({
    id: c.id_celebracion,
    nombre_completo: c.nombre_completo,
    fecha_nacimiento: c.fecha_nacimiento,
    telefono: c.telefono,
    fecha_preferida: c.fecha_preferida,
    hora_preferida: c.hora_preferida,
    acepta_verificacion: c.acepta_verificacion
  }));
}

const celebrateController = {
  // Crear nueva celebración
  crearCelebracion: async (req, res) => {
    try {
      const { nombre_completo, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, acepta_verificacion } = req.body;

      if (!nombre_completo || !fecha_nacimiento || !telefono || !fecha_preferida || !hora_preferida) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      const result = await db.query(
        `INSERT INTO Celebrate (nombre_completo, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, acepta_verificacion)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [nombre_completo, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, acepta_verificacion]
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
      const result = await db.query("SELECT * FROM Celebrate ORDER BY id_celebracion DESC");
      res.json(normalizarCelebraciones(result.rows));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener las celebraciones" });
    }
  }
};

module.exports = celebrateController;
