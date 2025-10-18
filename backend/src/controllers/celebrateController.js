// src/controllers/celebrateController.js
const db = require("../config/database"); // tu database.js de Supabase

const celebrateController = {
  crearCelebracion: async (req, res) => {
    try {
      const { nombre_completo, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, acepta_verificacion } = req.body;

      if (!nombre_completo || !fecha_nacimiento || !telefono || !fecha_preferida || !hora_preferida) {
        return res.status(400).json({ error: "Todos los campos son requeridos" });
      }

      const result = await db.query(
        `INSERT INTO Celebrate 
          (nombre_completo, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, acepta_verificacion) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [nombre_completo, fecha_nacimiento, telefono, fecha_preferida, hora_preferida, acepta_verificacion]
      );

      res.json({ message: "✅ Celebración guardada", data: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al guardar la celebración" });
    }
  },

  obtenerCelebraciones: async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Celebrate ORDER BY id_celebracion DESC");
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener celebraciones" });
    }
  }
};

module.exports = celebrateController;
