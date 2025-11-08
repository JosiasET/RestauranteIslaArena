const db = require('../config/database');

// Funciones para imagen (si no tienes imageUtils, usa estas)
const processImage = (imagen) => {
  if (imagen && imagen.startsWith('data:image')) {
    return Buffer.from(imagen.split(',')[1], 'base64');
  }
  return null;
};

const formatImageResponse = (rows) => {
  return rows.map(row => {
    if (row.image) {
      row.image = `data:image/jpeg;base64,${row.image.toString('base64')}`;
    }
    return row;
  });
};

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_product, // ✅ id_product en lugar de id_producto
    nombre: p.name,    // ✅ name en lugar de nombre
    descripcion: p.description, // ✅ subcategory como descripción
    descripcion_real: p.real_description, // ✅ real_description
    precio: p.price,   // ✅ price en lugar de precio
    imagen: p.image,   // ✅ image en lugar de imagen
    cantidad_productos: p.product_quantity || 0 // ✅ product_quantity en lugar de cantidad_productos
  }));
}

const bebidasController = {
  // Crear bebida
  crearBebida: async (req, res) => {
    const { nombre, descripcion, precio, imagen, cantidad_productos } = req.body;
    const categoria = "Bebida";

    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const result = await db.query(
        `INSERT INTO products 
         (name, description, price, category, image, product_quantity) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          nombre, 
          descripcion || "", 
          precio, 
          categoria, 
          buffer, 
          cantidad_productos || 0
        ]
      );

      const bebida = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(bebida);
    } catch (err) {
      console.error('❌ Error al crear bebida:', err);
      res.status(500).json({ error: "Error al crear bebida: " + err.message });
    }
  },

  // Obtener solo bebidas
  obtenerBebidas: async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM products WHERE category = 'Bebida' ORDER BY id_product DESC"
      );
      const bebidas = normalizarIDs(formatImageResponse(result.rows));
      res.json(bebidas);
    } catch (err) {
      console.error('❌ Error al obtener bebidas:', err);
      res.status(500).json({ error: "Error al obtener bebidas: " + err.message });
    }
  },

  // Actualizar bebida
  actualizarBebida: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen, cantidad_productos } = req.body;

    try {
      const buffer = processImage(imagen);
      let sql, values;

      if (buffer) {
        sql = `UPDATE products 
               SET name=$1, description=$2, price=$3, image=$4, product_quantity=$5, updated_at=NOW() 
               WHERE id_product=$6 AND category='Bebida' 
               RETURNING *`;
        values = [nombre, descripcion || "", precio, buffer, cantidad_productos || 0, id];
      } else {
        sql = `UPDATE products 
               SET name=$1, description=$2, price=$3, product_quantity=$4, updated_at=NOW() 
               WHERE id_product=$5 AND category='Bebida' 
               RETURNING *`;
        values = [nombre, descripcion || "", precio, cantidad_productos || 0, id];
      }

      const result = await db.query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Bebida no encontrada" });
      }

      const bebida = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(bebida);
    } catch (err) {
      console.error('❌ Error al actualizar bebida:', err);
      res.status(500).json({ error: "Error al actualizar bebida: " + err.message });
    }
  },

  // Eliminar bebida
  eliminarBebida: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        "DELETE FROM products WHERE id_product=$1 AND category='Bebida' RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Bebida no encontrada" });
      }

      res.json({ message: "✅ Bebida eliminada" });
    } catch (err) {
      console.error('❌ Error al eliminar bebida:', err);
      res.status(500).json({ error: "Error al eliminar bebida: " + err.message });
    }
  },

  // Obtener bebidas con stock
  obtenerBebidasConStock: async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM products WHERE category = 'Bebida' ORDER BY name"
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
        `UPDATE products 
         SET product_quantity = $1, updated_at = NOW() 
         WHERE id_product = $2 AND category = 'Bebida' 
         RETURNING *`,
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
  },

  // Obtener todos los productos con stock (bebidas y especialidades)
  obtenerProductosConStock: async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM products WHERE category IN ('Bebida', 'Especialidad') ORDER BY category, name"
      );
      const productos = normalizarIDs(formatImageResponse(result.rows));
      res.json(productos);
    } catch (err) {
      console.error('❌ Error al obtener productos con stock:', err);
      res.status(500).json({ error: "Error al obtener productos con stock: " + err.message });
    }
  },

  // Actualizar stock de cualquier producto
  actualizarStock: async (req, res) => {
    const { id } = req.params;
    const { cantidad_productos } = req.body;

    if (cantidad_productos === undefined || cantidad_productos === null) {
      return res.status(400).json({ error: "La cantidad es requerida" });
    }

    try {
      const result = await db.query(
        `UPDATE products 
         SET product_quantity = $1, updated_at = NOW() 
         WHERE id_product = $2 
         RETURNING *`,
        [cantidad_productos, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      const producto = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(producto);
    } catch (err) {
      console.error('❌ Error al actualizar stock:', err);
      res.status(500).json({ error: "Error al actualizar stock: " + err.message });
    }
  }
};

module.exports = bebidasController;