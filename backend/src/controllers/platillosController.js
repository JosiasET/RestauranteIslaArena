const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_producto,
    // SOLO procesar los campos que existen en la tabla
    tamanos: p.tamanos ? (typeof p.tamanos === 'string' ? JSON.parse(p.tamanos) : p.tamanos) : [],
    tiene_tamanos: p.tiene_tamanos || false
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
      
      // SOLO tamanos (no tipos)
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      const result = await db.query(
        `INSERT INTO Productos
         (nombre, descripcion, subcategoria, precio, categoria, imagen, tiene_tamanos, tamanos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
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
        "SELECT * FROM Productos WHERE categoria='Platillo' ORDER BY id_producto DESC"
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
      
      // SOLO tamanos (no tipos)
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      let sql, values;
      if (buffer) {
        sql = `UPDATE Productos
               SET nombre=$1, descripcion=$2, subcategoria=$3, precio=$4, imagen=$5, 
                   tiene_tamanos=$6, tamanos=$7
               WHERE id_producto=$8 RETURNING *`;
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
        sql = `UPDATE Productos
               SET nombre=$1, descripcion=$2, subcategoria=$3, precio=$4,
                   tiene_tamanos=$5, tamanos=$6
               WHERE id_producto=$7 RETURNING *`;
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
        "DELETE FROM Productos WHERE id_producto=$1 RETURNING *",
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