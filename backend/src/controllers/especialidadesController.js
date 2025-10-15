const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_especialidad, // para compatibilidad con Angular
  }));
}

const especialidadesController = {
  // Crear especialidad
  crearEspecialidad: async (req, res) => {
    const { nombre, descripcion, precio, imagen } = req.body;
    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const result = await db.query(
        "INSERT INTO Especialidades_mar (nombre, descripcion, precio, imagen) VALUES ($1, $2, $3, $4) RETURNING *",
        [nombre, descripcion, precio, buffer]
      );
      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(especialidad);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al crear especialidad" });
    }
  },

  // Obtener todas las especialidades
  obtenerEspecialidades: async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Especialidades_mar ORDER BY id_especialidad DESC");
      const especialidades = normalizarIDs(formatImageResponse(result.rows));
      res.json(especialidades);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener especialidades" });
    }
  },

  // Actualizar especialidad
  actualizarEspecialidad: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;

    try {
      const buffer = processImage(imagen);
      let sql, values;

      if (buffer) {
        sql = "UPDATE Especialidades_mar SET nombre=$1, descripcion=$2, precio=$3, imagen=$4 WHERE id_especialidad=$5 RETURNING *";
        values = [nombre, descripcion, precio, buffer, id];
      } else {
        sql = "UPDATE Especialidades_mar SET nombre=$1, descripcion=$2, precio=$3 WHERE id_especialidad=$4 RETURNING *";
        values = [nombre, descripcion, precio, id];
      }

      const result = await db.query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(especialidad);
    } catch (err) {
      res.status(500).json({ error: "Error al actualizar especialidad" });
    }
  },

  // Eliminar especialidad
  eliminarEspecialidad: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query("DELETE FROM Especialidades_mar WHERE id_especialidad=$1 RETURNING *", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }
      res.json({ message: "✅ Especialidad eliminada" });
    } catch (err) {
      res.status(500).json({ error: "Error al eliminar especialidad" });
    }
  }
};

module.exports = especialidadesController;
