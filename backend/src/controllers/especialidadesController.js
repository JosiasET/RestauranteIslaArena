const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_especialidad,
    // Asegurar que los campos JSON sean arrays válidos
    tipos: p.tipos ? (typeof p.tipos === 'string' ? JSON.parse(p.tipos) : p.tipos) : [],
    tamanos: p.tamanos ? (typeof p.tamanos === 'string' ? JSON.parse(p.tamanos) : p.tamanos) : [],
    tiene_tamanos: p.tiene_tamanos
  }));
}

const especialidadesController = {
  // Crear especialidad
  crearEspecialidad: async (req, res) => {
    const { 
      nombre, 
      descripcion, 
      descripcion_real,
      precio, 
      imagen, 
      tiene_tamanos,
      tipos,
      tamanos
    } = req.body;
    
    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son requeridos" });
    }

    try {
      const buffer = processImage(imagen);
      
      // Convertir a JSON si viene como array
      const tiposJSON = tipos ? JSON.stringify(tipos) : null;
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      const result = await db.query(
        `INSERT INTO Especialidades_mar 
         (nombre, descripcion, descripcion_real, precio, imagen, tiene_tamanos, tipos, tamanos) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [nombre, descripcion, descripcion_real, precio, buffer, tiene_tamanos || false, tiposJSON, tamanosJSON]
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
      const result = await db.query("SELECT * FROM Especialidades_mar ORDER BY id_especialidad DESC");
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
    const { 
      nombre, 
      descripcion, 
      descripcion_real,
      precio, 
      imagen, 
      tiene_tamanos,
      tipos,
      tamanos
    } = req.body;

    try {
      const buffer = processImage(imagen);
      
      const tiposJSON = tipos ? JSON.stringify(tipos) : null;
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      let sql, values;

      if (buffer) {
        sql = `UPDATE Especialidades_mar 
               SET nombre=$1, descripcion=$2, descripcion_real=$3, precio=$4, imagen=$5, 
                   tiene_tamanos=$6, tipos=$7, tamanos=$8 
               WHERE id_especialidad=$9 
               RETURNING *`;
        values = [nombre, descripcion, descripcion_real, precio, buffer, tiene_tamanos, tiposJSON, tamanosJSON, id];
      } else {
        sql = `UPDATE Especialidades_mar 
               SET nombre=$1, descripcion=$2, descripcion_real=$3, precio=$4, 
                   tiene_tamanos=$5, tipos=$6, tamanos=$7 
               WHERE id_especialidad=$8 
               RETURNING *`;
        values = [nombre, descripcion, descripcion_real, precio, tiene_tamanos, tiposJSON, tamanosJSON, id];
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
      const result = await db.query("DELETE FROM Especialidades_mar WHERE id_especialidad=$1 RETURNING *", [id]);
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