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
    descripcion: p.subcategory,
    descripcion_real: p.description,
    precio: p.price,
    imagen: p.image,
    tiene_tamanos: p.has_sizes || false,
    tamanos: p.sizes ? (typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes) : [],
    cantidad: p.product_quantity || 0 // ✅ CORREGIDO: Usar product_quantity real
  }));
}

const especialidadesController = {
  // Crear especialidad - ✅ CORREGIDO
  crearEspecialidad: async (req, res) => {
    const { nombre, descripcion, descripcion_real, precio, imagen, tiene_tamanos, tamanos, product_quantity } = req.body;

    console.log('📥 CREAR - Datos recibidos:', { nombre, product_quantity }); // ✅ DEBUG

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
         (name, description, subcategory, price, category, image, has_sizes, sizes, product_quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          nombre,
          descripcionGeneral,
          subcategoria,
          precio,
          categoria,
          buffer,
          tiene_tamanos || false,
          tamanosJSON,
          product_quantity || 0 // ✅ AGREGAR product_quantity
        ]
      );

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      
      console.log('✅ CREAR - Especialidad creada con stock:', especialidad.cantidad); // ✅ DEBUG
      
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

  // Actualizar especialidad - ✅ CORREGIDO
  actualizarEspecialidad: async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, descripcion_real, precio, imagen, tiene_tamanos, tamanos, product_quantity } = req.body;

    console.log('📥 ACTUALIZAR - Datos recibidos:', { id, nombre, product_quantity }); // ✅ DEBUG

    try {
      const buffer = processImage(imagen);

      const subcategoria = descripcion || "";
      const descripcionGeneral = descripcion_real || "";

      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      let sql, values;

      if (buffer) {
        sql = `UPDATE products 
               SET name=$1, description=$2, subcategory=$3, price=$4, image=$5,
                   has_sizes=$6, sizes=$7, product_quantity=$8, updated_at=NOW()
               WHERE id_product=$9 AND category='Especialidad'
               RETURNING *`;
        values = [
          nombre,
          descripcionGeneral,
          subcategoria,
          precio,
          buffer,
          tiene_tamanos || false,
          tamanosJSON,
          product_quantity || 0, // ✅ AGREGAR product_quantity
          id
        ];
      } else {
        sql = `UPDATE products 
               SET name=$1, description=$2, subcategory=$3, price=$4,
                   has_sizes=$5, sizes=$6, product_quantity=$7, updated_at=NOW()
               WHERE id_product=$8 AND category='Especialidad'
               RETURNING *`;
        values = [
          nombre,
          descripcionGeneral,
          subcategoria,
          precio,
          tiene_tamanos || false,
          tamanosJSON,
          product_quantity || 0, // ✅ AGREGAR product_quantity
          id
        ];
      }

      console.log('🔧 ACTUALIZAR - Query ejecutado:', sql); // ✅ DEBUG
      console.log('🔧 ACTUALIZAR - Valores:', values); // ✅ DEBUG

      const result = await db.query(sql, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      
      console.log('✅ ACTUALIZAR - Especialidad actualizada con stock:', especialidad.cantidad); // ✅ DEBUG
      
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

  // Obtener especialidades con stock
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

  // Actualizar stock de especialidad
  actualizarStockEspecialidad: async (req, res) => {
    const { id } = req.params;
    const { cantidad_productos, product_quantity, cantidad } = req.body;

    const cantidadStock = cantidad_productos || product_quantity || cantidad;

    if (cantidadStock === undefined || cantidadStock === null) {
      return res.status(400).json({ error: "La cantidad es requerida" });
    }

    try {
      const result = await db.query(
        `UPDATE products 
         SET product_quantity = $1, updated_at = NOW() 
         WHERE id_product = $2 AND category = 'Especialidad' 
         RETURNING *`,
        [cantidadStock, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      
      console.log('✅ Stock de especialidad actualizado:', {
        id: especialidad.id,
        nombre: especialidad.nombre,
        stock: cantidadStock
      });
      
      res.json(especialidad);
    } catch (err) {
      console.error('❌ Error al actualizar stock de especialidad:', err);
      res.status(500).json({ error: "Error al actualizar stock: " + err.message });
    }
  }
};

module.exports = especialidadesController;