const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(b => ({
    ...b,
    id: b.id_bebida, // 👈 Angular usará 'id' universalmente
  }));
}

const bebidasController = {
  // Crear bebida
  crearBebida: async (req, res) => {
    const { nombre, descripcion, precio, imagen } = req.body;
    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const result = await db.query(
        "INSERT INTO Bebidas (nombre, descripcion, precio, imagen) VALUES ($1, $2, $3, $4) RETURNING *",
        [nombre, descripcion, precio, buffer]
      );

      const bebida = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(bebida); // 👈 devolvemos solo el objeto
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al crear bebida" });
    }
  },

  // Obtener todas las bebidas
  obtenerBebidas: async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Bebidas ORDER BY id_bebida DESC");
      const bebidas = normalizarIDs(formatImageResponse(result.rows));
      res.json(bebidas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener bebidas" });
    }
  },

  // Actualizar bebida
  actualizarBebida: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;

    try {
      const buffer = processImage(imagen);
      let sql, values;

      if (buffer) {
        sql = "UPDATE Bebidas SET nombre=$1, descripcion=$2, precio=$3, imagen=$4 WHERE id_bebida=$5 RETURNING *";
        values = [nombre, descripcion, precio, buffer, id];
      } else {
        sql = "UPDATE Bebidas SET nombre=$1, descripcion=$2, precio=$3 WHERE id_bebida=$4 RETURNING *";
        values = [nombre, descripcion, precio, id];
      }

      const result = await db.query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Bebida no encontrada" });
      }

      const bebida = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(bebida);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al actualizar bebida" });
    }
  },

  // Eliminar bebida
  eliminarBebida: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query("DELETE FROM Bebidas WHERE id_bebida=$1 RETURNING *", [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Bebida no encontrada" });
      }

      res.json({ message: "✅ Bebida eliminada" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al eliminar bebida" });
    }
  }
};

module.exports = bebidasController;
