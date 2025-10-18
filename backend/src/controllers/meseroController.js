// src/controllers/meseroController.js
const db = require('../config/database'); // Tu pool de PostgreSQL

const meseroController = {
  /** 🔹 Obtener todos los meseros */
  getMeseros: async (req, res) => {
    try {
      const { rows } = await db.query('SELECT * FROM meseros ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener meseros:', error);
      res.status(500).json({ error: 'Error al obtener meseros' });
    }
  },

  /** 🔹 Crear mesero */
  crearMesero: async (req, res) => {
    const { nombre, apellido, usuario, contrasena, rol, turno } = req.body;
    try {
      const query = `
        INSERT INTO meseros (nombre, apellido, username, password, rol, turno)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;
      const values = [nombre, apellido, usuario, contrasena, rol, turno];
      const { rows } = await db.query(query, values);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Error al crear mesero:', error);
      res.status(500).json({ error: 'Error al crear mesero' });
    }
  },

  /** 🔹 Actualizar mesero */
  actualizarMesero: async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, usuario, contrasena, rol, turno, activo } = req.body;
    try {
      const query = `
        UPDATE meseros
        SET nombre=$1, apellido=$2, username=$3, password=$4, rol=$5, turno=$6, activo=$7
        WHERE id=$8
        RETURNING *`;
      const values = [nombre, apellido, usuario, contrasena, rol, turno, activo, id];
      const { rows } = await db.query(query, values);
      res.json(rows[0]);
    } catch (error) {
      console.error('Error al actualizar mesero:', error);
      res.status(500).json({ error: 'Error al actualizar mesero' });
    }
  },

  /** 🔹 Eliminar mesero */
  eliminarMesero: async (req, res) => {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM meseros WHERE id=$1', [id]);
      res.json({ message: 'Mesero eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar mesero:', error);
      res.status(500).json({ error: 'Error al eliminar mesero' });
    }
  },

  /** 🔹 Activar/Desactivar mesero */
  toggleEstado: async (req, res) => {
    const { id } = req.params;
    try {
      const { rows } = await db.query('SELECT activo FROM meseros WHERE id=$1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Mesero no encontrado' });
      const nuevoEstado = !rows[0].activo;
      const updated = await db.query(
        'UPDATE meseros SET activo=$1 WHERE id=$2 RETURNING *',
        [nuevoEstado, id]
      );
      res.json(updated.rows[0]);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      res.status(500).json({ error: 'Error al cambiar estado' });
    }
  }
};

module.exports = meseroController;
