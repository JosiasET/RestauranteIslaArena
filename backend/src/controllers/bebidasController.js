const db = require("../config/bd");
const { processImage, imageToBase64 } = require("../utils/imageUtils");

const bebidasController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Bebidas");
      const bebidas = result.rows.map((row) => ({
        ...row,
        imagen: imageToBase64(row.imagen)
      }));
      res.json(bebidas);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener bebidas" });
    }
  },

  create: async (req, res) => {
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
      
      const bebida = {
        ...result.rows[0],
        imagen: imageToBase64(result.rows[0].imagen)
      };
      
      res.json({ message: "✅ Bebida guardada", data: bebida });
    } catch (err) {
      res.status(500).json({ error: "Error al crear bebida" });
    }
  },

  update: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;

    try {
      const buffer = processImage(imagen);
      const sql = buffer
        ? "UPDATE Bebidas SET nombre=$1, descripcion=$2, precio=$3, imagen=$4 WHERE id_bebida=$5 RETURNING *"
        : "UPDATE Bebidas SET nombre=$1, descripcion=$2, precio=$3 WHERE id_bebida=$4 RETURNING *";

      const values = buffer ? [nombre, descripcion, precio, buffer, id] : [nombre, descripcion, precio, id];

      const result = await db.query(sql, values);
      const bebida = {
        ...result.rows[0],
        imagen: imageToBase64(result.rows[0].imagen)
      };

      res.json({ message: "✅ Bebida actualizada", data: bebida });
    } catch (err) {
      res.status(500).json({ error: "Error al actualizar bebida" });
    }
  },

  delete: async (req, res) => {
    try {
      await db.query("DELETE FROM Bebidas WHERE id_bebida=$1", [req.params.id]);
      res.json({ message: "✅ Bebida eliminada" });
    } catch (err) {
      res.status(500).json({ error: "Error al eliminar bebida" });
    }
  }
};

module.exports = bebidasController;