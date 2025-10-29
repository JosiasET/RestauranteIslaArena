const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_producto,
    cantidad_productos: p.cantidad_productos || 0 // ✅ Stock para drinks
  }));
}

const productosController = {
  // Crear producto (Drinks)
  crearProducto: async (req, res) => {
    const { nombre, descripcion, precio, imagen, cantidad_productos } = req.body;
    const categoria = "Bebida";

    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const result = await db.query(
        "INSERT INTO Productos (nombre, descripcion, precio, categoria, imagen, cantidad_productos) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [nombre, descripcion, precio, categoria, buffer, cantidad_productos || 0]
      );

      const producto = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(producto);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al crear producto" });
    }
  },

  // Obtener solo bebidas
  obtenerBebidas: async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM Productos WHERE categoria = 'Bebida' ORDER BY id_producto DESC"
      );
      const bebidas = normalizarIDs(formatImageResponse(result.rows));
      res.json(bebidas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener bebidas" });
    }
  },

  // Actualizar bebida
  actualizarProducto: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen, cantidad_productos } = req.body;

    try {
      const buffer = processImage(imagen);
      let sql, values;

      if (buffer) {
        sql = "UPDATE Productos SET nombre=$1, descripcion=$2, precio=$3, imagen=$4, cantidad_productos=$5 WHERE id_producto=$6 RETURNING *";
        values = [nombre, descripcion, precio, buffer, cantidad_productos || 0, id];
      } else {
        sql = "UPDATE Productos SET nombre=$1, descripcion=$2, precio=$3, cantidad_productos=$4 WHERE id_producto=$5 RETURNING *";
        values = [nombre, descripcion, precio, cantidad_productos || 0, id];
      }

      const result = await db.query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const producto = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(producto);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al actualizar producto" });
    }
  },

  // Eliminar bebida
  eliminarProducto: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        "DELETE FROM Productos WHERE id_producto=$1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      res.json({ message: "✅ Producto eliminado" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al eliminar producto" });
    }
  }
};

module.exports = productosController;