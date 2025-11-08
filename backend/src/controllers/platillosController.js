const db = require('../config/database');

// Funciones para imagen (si no tienes imageUtils)
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
    id: p.id_product, // ✅ Usamos id_product
    nombre: p.name,
    descripcion: p.subcategory, // ✅ subcategory como descripción
    descripcion_real: p.description, // ✅ real_description como descripción_real
    precio: p.price,
    imagen: p.image,
    tiene_tamanos: p.has_sizes || false,
    tamanos: p.sizes ? (typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes) : []
  }));
}

const platillosController = {
  // Crear platillo
  crearPlatillo: async (req, res) => {
    const { nombre, descripcion, descripcion_real, precio, imagen, tiene_tamanos, tamanos } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const categoria = "Platillo";           
      const subcategoria = descripcion;
      const descripcionGeneral = descripcion_real || null;
      
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      const result = await db.query(
        `INSERT INTO products 
         (name, description, subcategory, price, category, image, has_sizes, sizes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          nombre, 
          descripcionGeneral, 
          subcategoria, 
          precio, 
          categoria, 
          buffer,
          tiene_tamanos || false,
          tamanosJSON
        ]
      );

      const platillo = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(platillo);
    } catch (err) {
      console.error('❌ Error al crear platillo:', err);
      res.status(500).json({ error: "Error al crear platillo: " + err.message });
    }
  },

  // Obtener todos los platillos
  obtenerPlatillos: async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM products WHERE category='Platillo' ORDER BY id_product DESC"
      );
      const platillos = normalizarIDs(formatImageResponse(result.rows));
      res.json(platillos);
    } catch (err) {
      console.error('❌ Error al obtener platillos:', err);
      res.status(500).json({ error: "Error al obtener platillos: " + err.message });
    }
  },

  // Actualizar platillo
  actualizarPlatillo: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, descripcion_real, precio, imagen, tiene_tamanos, tamanos } = req.body;

    try {
      const buffer = processImage(imagen);
      const subcategoria = descripcion;
      const descripcionGeneral = descripcion_real || null;
      
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      let sql, values;
      if (buffer) {
        sql = `UPDATE products
               SET name=$1,description=$2, subcategory=$3, price=$4, image=$5, 
                   has_sizes=$6, sizes=$7
               WHERE id_product=$8 RETURNING *`;
        values = [
          nombre, 
          descripcionGeneral, 
          subcategoria, 
          precio, 
          buffer,
          tiene_tamanos || false,
          tamanosJSON,
          id
        ];
      } else {
        sql = `UPDATE products
               SET name=$1, description=$2, subcategory=$3, price=$4,
                   has_sizes=$5, sizes=$6
               WHERE id_product=$7 RETURNING *`;
        values = [
          nombre, 
          descripcionGeneral, 
          subcategoria, 
          precio,
          tiene_tamanos || false,
          tamanosJSON,
          id
        ];
      }

      const result = await db.query(sql, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Platillo no encontrado" });
      }

      const platillo = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(platillo);
    } catch (err) {
      console.error('❌ Error al actualizar platillo:', err);
      res.status(500).json({ error: "Error al actualizar platillo: " + err.message });
    }
  },

  // Eliminar platillo
  eliminarPlatillo: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query(
        "DELETE FROM products WHERE id_product=$1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Platillo no encontrado" });
      }
      res.json({ message: "✅ Platillo eliminado" });
    } catch (err) {
      console.error('❌ Error al eliminar platillo:', err);
      res.status(500).json({ error: "Error al eliminar platillo: " + err.message });
    }
  }
};

module.exports = platillosController;