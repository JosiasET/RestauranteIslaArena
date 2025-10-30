const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_producto,
    tipos: p.tipos ? (typeof p.tipos === 'string' ? JSON.parse(p.tipos) : p.tipos) : [],
    tamanos: p.tamanos ? (typeof p.tamanos === 'string' ? JSON.parse(p.tamanos) : p.tamanos) : [],
    tiene_tamanos: p.tiene_tamanos || false,
    cantidad: p.unidad || 0 // ✅ Mapear unidad a cantidad para Angular
  }));
}

const especialidadesController = {
  // Crear especialidad
  crearEspecialidad: async (req, res) => {
    const { nombre, descripcion, precio, imagen, tiene_tamanos, tipos, tamanos, cantidad } = req.body;

    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      const categoria = "Especialidad";
      const tiposJSON = tipos ? JSON.stringify(tipos) : null;
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      const result = await db.query(
        `INSERT INTO Productos 
         (nombre, descripcion, precio, categoria, subcategoria, imagen, unidad, tiene_tamanos, tamanos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          nombre, 
          descripcion || "", 
          precio, 
          categoria, 
          tiposJSON, 
          buffer, 
          cantidad || 0,
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
        "SELECT * FROM Productos WHERE categoria='Especialidad' ORDER BY id_producto DESC"
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
    const { nombre, descripcion, precio, imagen, tiene_tamanos, tipos, tamanos, cantidad } = req.body;

    try {
      const buffer = processImage(imagen);
      const tiposJSON = tipos ? JSON.stringify(tipos) : null;
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      let sql, values;
      if (buffer) {
        sql = `UPDATE Productos 
               SET nombre=$1, descripcion=$2, precio=$3, subcategoria=$4, imagen=$5, 
                   unidad=$6, tiene_tamanos=$7, tamanos=$8
               WHERE id_producto=$9 AND categoria='Especialidad'
               RETURNING *`;
        values = [
          nombre, descripcion || "", precio, tiposJSON, buffer, 
          cantidad || 0, tiene_tamanos || false, tamanosJSON, id
        ];
      } else {
        sql = `UPDATE Productos 
               SET nombre=$1, descripcion=$2, precio=$3, subcategoria=$4,
                   unidad=$5, tiene_tamanos=$6, tamanos=$7
               WHERE id_producto=$8 AND categoria='Especialidad'
               RETURNING *`;
        values = [
          nombre, descripcion || "", precio, tiposJSON,
          cantidad || 0, tiene_tamanos || false, tamanosJSON, id
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
        "DELETE FROM Productos WHERE id_producto=$1 AND categoria='Especialidad' RETURNING *",
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
  }, // ✅ AGREGAR COMA AQUÍ

  // Obtener especialidades con stock
  obtenerEspecialidadesConStock: async (req, res) => {
    try {
      const result = await db.query(
        "SELECT * FROM Productos WHERE categoria='Especialidad' ORDER BY nombre"
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
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null) {
      return res.status(400).json({ error: "La cantidad es requerida" });
    }

    try {
      const result = await db.query(
        "UPDATE Productos SET unidad = $1 WHERE id_producto = $2 AND categoria='Especialidad' RETURNING *",
        [cantidad, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(especialidad);
    } catch (err) {
      console.error('❌ Error al actualizar stock de especialidad:', err);
      res.status(500).json({ error: "Error al actualizar stock: " + err.message });
    }
  }
}; // ✅ CIERRE CORRECTO DEL OBJETO

module.exports = especialidadesController;