const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(b => ({
    ...b,
    id: b.id_bebida,
    cantidad_productos: b.cantidad_productos || 0 // ✅ AGREGAR stock
  }));
}

const bebidasController = {
  crearBebida: async (req, res) => {
    const { nombre, descripcion, precio, imagen, cantidad_productos } = req.body; // ✅ RECIBIR stock
    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const result = await db.query(
        "INSERT INTO Bebidas (nombre, descripcion, precio, imagen, cantidad_productos) VALUES ($1, $2, $3, $4, $5) RETURNING *", // ✅ AGREGAR campo
        [nombre, descripcion, precio, buffer, cantidad_productos || 0] // ✅ ENVIAR stock
      );

      const bebida = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(bebida);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al crear bebida" });
    }
  },

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

  actualizarBebida: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen, cantidad_productos } = req.body; // ✅ RECIBIR stock

    try {
      const buffer = processImage(imagen);
      let sql, values;

      if (buffer) {
        sql = "UPDATE Bebidas SET nombre=$1, descripcion=$2, precio=$3, imagen=$4, cantidad_productos=$5 WHERE id_bebida=$6 RETURNING *"; // ✅ AGREGAR campo
        values = [nombre, descripcion, precio, buffer, cantidad_productos || 0, id]; // ✅ ENVIAR stock
      } else {
        sql = "UPDATE Bebidas SET nombre=$1, descripcion=$2, precio=$3, cantidad_productos=$4 WHERE id_bebida=$5 RETURNING *"; // ✅ AGREGAR campo
        values = [nombre, descripcion, precio, cantidad_productos || 0, id]; // ✅ ENVIAR stock
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
  },
  // bebidasController.js - AGREGAR AL FINAL

// Obtener bebidas con stock
obtenerBebidasConStock: async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM Bebidas ORDER BY nombre"
    );
    const bebidas = normalizarIDs(formatImageResponse(result.rows));
    res.json(bebidas);
  } catch (err) {
    console.error('❌ Error al obtener bebidas con stock:', err);
    res.status(500).json({ error: "Error al obtener bebidas con stock: " + err.message });
  }
},

// Actualizar stock de bebida
actualizarStockBebida: async (req, res) => {
  const { id } = req.params;
  const { cantidad_productos } = req.body;

  if (cantidad_productos === undefined || cantidad_productos === null) {
    return res.status(400).json({ error: "La cantidad es requerida" });
  }

  try {
    const result = await db.query(
      "UPDATE Bebidas SET cantidad_productos = $1 WHERE id_bebida = $2 RETURNING *",
      [cantidad_productos, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bebida no encontrada" });
    }

    const bebida = normalizarIDs(formatImageResponse(result.rows))[0];
    res.json(bebida);
  } catch (err) {
    console.error('❌ Error al actualizar stock de bebida:', err);
    res.status(500).json({ error: "Error al actualizar stock: " + err.message });
    }
  }
};

module.exports = bebidasController;