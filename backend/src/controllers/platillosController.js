const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_platillo, // 👈 Esto asegura compatibilidad con Angular
  }));
}

const platillosController = {
  // Crear platillo
  crearPlatillo: async (req, res) => {
    const { nombre, descripcion, precio, imagen } = req.body;
    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const result = await db.query(
        "INSERT INTO Platillos (nombre, descripcion, precio, imagen) VALUES ($1, $2, $3, $4) RETURNING *",
        [nombre, descripcion, precio, buffer]
      );
      const platillo = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(platillo); // 👈 Devuelve el objeto limpio, no envuelto en data
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al crear platillo" });
    }
  },

  // Obtener todos los platillos
  obtenerPlatillos: async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Platillos ORDER BY id_platillo DESC");
      const platillos = normalizarIDs(formatImageResponse(result.rows));
      res.json(platillos);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener platillos" });
    }
  },

  // Actualizar platillo
  actualizarPlatillo: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;

    try {
      const buffer = processImage(imagen);
      let sql, values;

      if (buffer) {
        sql = "UPDATE Platillos SET nombre=$1, descripcion=$2, precio=$3, imagen=$4 WHERE id_platillo=$5 RETURNING *";
        values = [nombre, descripcion, precio, buffer, id];
      } else {
        sql = "UPDATE Platillos SET nombre=$1, descripcion=$2, precio=$3 WHERE id_platillo=$4 RETURNING *";
        values = [nombre, descripcion, precio, id];
      }

      const result = await db.query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Platillo no encontrado" });
      }

      const platillo = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(platillo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al actualizar platillo" });
    }
  },

  // Eliminar platillo
  eliminarPlatillo: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query("DELETE FROM Platillos WHERE id_platillo=$1 RETURNING *", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Platillo no encontrado" });
      }
      res.json({ message: "✅ Platillo eliminado" });
    } catch (err) {
      res.status(500).json({ error: "Error al eliminar platillo" });
    }
  }
};

module.exports = platillosController;
