const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

function normalizarIDs(rows) {
  return rows.map(p => ({
    ...p,
    id: p.id_platillo,
    // Asegurar que los campos JSON sean arrays válidos
    tipos: p.tipos ? (typeof p.tipos === 'string' ? JSON.parse(p.tipos) : p.tipos) : [],
    tamanos: p.tamanos ? (typeof p.tamanos === 'string' ? JSON.parse(p.tamanos) : p.tamanos) : [],
    tiene_tamanos: p.tiene_tamanos
  }));
}

const platillosController = {
  // Crear platillo
  crearPlatillo: async (req, res) => {
    const { 
      nombre, 
      descripcion, 
      descripcion_real,  // 👈 Asegúrate de recibir este campo
      precio, 
      imagen, 
      tiene_tamanos,     // 👈 Asegúrate de recibir este campo
      tipos,             // 👈 Asegúrate de recibir este campo
      tamanos            // 👈 Asegúrate de recibir este campo
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
        `INSERT INTO Platillos 
         (nombre, descripcion, descripcion_real, precio, imagen, tiene_tamanos, tipos, tamanos) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [nombre, descripcion, descripcion_real, precio, buffer, tiene_tamanos || false, tiposJSON, tamanosJSON]
      );
      
      const platillo = normalizarIDs(formatImageResponse(result.rows))[0];
      res.json(platillo);
    } catch (err) {
      console.error('❌ Error al crear platillo:', err);
      res.status(500).json({ error: "Error al crear platillo: " + err.message });
    }
  },

  // Actualizar platillo
  actualizarPlatillo: async (req, res) => {
    const { id } = req.params;
    const { 
      nombre, 
      descripcion, 
      descripcion_real,  // 👈 Asegúrate de recibir este campo
      precio, 
      imagen, 
      tiene_tamanos,     // 👈 Asegúrate de recibir este campo
      tipos,             // 👈 Asegúrate de recibir este campo
      tamanos            // 👈 Asegúrate de recibir este campo
    } = req.body;

    try {
      const buffer = processImage(imagen);
      
      // Convertir a JSON si viene como array
      const tiposJSON = tipos ? JSON.stringify(tipos) : null;
      const tamanosJSON = tamanos ? JSON.stringify(tamanos) : null;

      let sql, values;

      if (buffer) {
        sql = `UPDATE Platillos 
               SET nombre=$1, descripcion=$2, descripcion_real=$3, precio=$4, imagen=$5, 
                   tiene_tamanos=$6, tipos=$7, tamanos=$8 
               WHERE id_platillo=$9 
               RETURNING *`;
        values = [nombre, descripcion, descripcion_real, precio, buffer, tiene_tamanos, tiposJSON, tamanosJSON, id];
      } else {
        sql = `UPDATE Platillos 
               SET nombre=$1, descripcion=$2, descripcion_real=$3, precio=$4, 
                   tiene_tamanos=$5, tipos=$6, tamanos=$7 
               WHERE id_platillo=$8 
               RETURNING *`;
        values = [nombre, descripcion, descripcion_real, precio, tiene_tamanos, tiposJSON, tamanosJSON, id];
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

  // Los otros métodos se mantienen igual...
  obtenerPlatillos: async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Platillos ORDER BY id_platillo DESC");
      const platillos = normalizarIDs(formatImageResponse(result.rows));
      res.json(platillos);
    } catch (err) {
      console.error('❌ Error al obtener platillos:', err);
      res.status(500).json({ error: "Error al obtener platillos: " + err.message });
    }
  },

  eliminarPlatillo: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query("DELETE FROM Platillos WHERE id_platillo=$1 RETURNING *", [id]);
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