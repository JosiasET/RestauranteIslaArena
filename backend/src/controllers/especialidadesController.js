const db = require('../config/database');

// Funciones para imagen
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
    id: p.id_product,
    nombre: p.name,
    descripcion: p.subcategory,      // subcategory como descripción
    descripcion_real: p.description, // description como descripción_real
    precio: p.price,
    imagen: p.image,
    tiene_tamanos: p.has_sizes || false,
    tamanos: p.sizes ? (typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes) : [],
    cantidad: 0 // por defecto, porque products no tiene cantidad
  }));
}

const especialidadesController = {
  // Crear especialidad
  crearEspecialidad: async (req, res) => {
    const { nombre, descripcion, descripcion_real, precio, imagen, tiene_tamanos, tamanos } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const categoria = "Especialidad";

      const subcategoria = descripcion || "";
      const descripcionGeneral = descripcion_real || "";

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

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(especialidad);
    } catch (err) {
      console.error('❌ Error al crear especialidad:', err);
      res.status(500).json({ error: "Error al crear especialidad: " + err.message });
    }
  },

  // Obtener todas las especialidades
  obtenerEspecialidades: async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM products WHERE category='Especialidad' ORDER BY id_product DESC"
      );
      const especialidades = normalizarIDs(formatImageResponse(result.rows));
      res.json(especialidades);
    } catch (err) {
      console.error('❌ Error al obtener especialidades:', err);
      res.status(500).json({ error: "Error al obtener especialidades: " + err.message });
    }
  },

  // Actualizar especialidad
  actualizarEspecialidad: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, descripcion_real, precio, imagen, tiene_tamanos, tamanos } = req.body;

    try {
      const buffer = processImage(imagen);

      const subcategoria = descripcion || "";
      const descripcionGeneral = descripcion_real || "";

      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      let sql, values;

      if (buffer) {
        sql = `UPDATE products 
               SET name=$1, description=$2, subcategory=$3, price=$4, image=$5,
                   has_sizes=$6, sizes=$7, updated_at=NOW()
               WHERE id_product=$8 AND category='Especialidad'
               RETURNING *`;
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
                   has_sizes=$5, sizes=$6, updated_at=NOW()
               WHERE id_product=$7 AND category='Especialidad'
               RETURNING *`;
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
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(especialidad);
    } catch (err) {
      console.error('❌ Error al actualizar especialidad:', err);
      res.status(500).json({ error: "Error al actualizar especialidad: " + err.message });
    }
  },

  // Eliminar especialidad
  eliminarEspecialidad: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        "DELETE FROM products WHERE id_product=$1 AND category='Especialidad' RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      res.json({ message: "✅ Especialidad eliminada" });
    } catch (err) {
      console.error('❌ Error al eliminar especialidad:', err);
      res.status(500).json({ error: "Error al eliminar especialidad: " + err.message });
    }
  },

  // Obtener especialidades con stock (aunque no hay columna de stock)
  obtenerEspecialidadesConStock: async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM products WHERE category='Especialidad' ORDER BY name"
      );
      const especialidades = normalizarIDs(formatImageResponse(result.rows));
      res.json(especialidades);
    } catch (err) {
      console.error('❌ Error al obtener especialidades con stock:', err);
      res.status(500).json({ error: "Error al obtener especialidades con stock: " + err.message });
    }
  },

  // Actualizar stock de especialidad (no disponible)
  actualizarStockEspecialidad: async (req, res) => {
    res.status(400).json({ error: "Función no disponible - la tabla products no tiene columna de stock" });
  }
};

module.exports = especialidadesController;
