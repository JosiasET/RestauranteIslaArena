const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_producto,
    tipos: p.tipos ? (typeof p.tipos === 'string' ? JSON.parse(p.tipos) : p.tipos) : [],
    tamanos: p.tamanos ? (typeof p.tamanos === 'string' ? JSON.parse(p.tamanos) : p.tamanos) : [],
    tiene_tamanos: p.tiene_tamanos || false
  }));
}

const especialidadesController = {
  // Crear especialidad
  crearEspecialidad: async (req, res) => {
    const { nombre, descripcion, precio, imagen, tiene_tamanos, tipos, tamanos } = req.body;

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
         (nombre, descripcion, precio, categoria, subcategoria, imagen)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [nombre, descripcion || "", precio, categoria, tiposJSON, buffer]
      );

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      especialidad.tamanos = tamanos || [];
      especialidad.tiene_tamanos = tiene_tamanos || false;

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
    const { nombre, descripcion, precio, imagen, tiene_tamanos, tipos, tamanos } = req.body;

    try {
      const buffer = processImage(imagen);
      const tiposJSON = tipos ? JSON.stringify(tipos) : null;
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      let sql, values;
      if (buffer) {
        sql = `UPDATE Productos 
               SET nombre=$1, descripcion=$2, precio=$3, subcategoria=$4, imagen=$5
               WHERE id_producto=$6 AND categoria='Especialidad'
               RETURNING *`;
        values = [nombre, descripcion || "", precio, tiposJSON, buffer, id];
      } else {
        sql = `UPDATE Productos 
               SET nombre=$1, descripcion=$2, precio=$3, subcategoria=$4
               WHERE id_producto=$5 AND categoria='Especialidad'
               RETURNING *`;
        values = [nombre, descripcion || "", precio, tiposJSON, id];
      }

      const result = await db.query(sql, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Especialidad no encontrada" });
      }

      const especialidad = normalizarIDs(formatImageResponse(result.rows))[0];
      especialidad.tamanos = tamanos || [];
      especialidad.tiene_tamanos = tiene_tamanos || false;

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
  }
};

module.exports = especialidadesController;
