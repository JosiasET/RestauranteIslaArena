// src/controllers/meseroController.js
const db = require('../config/database');

const meseroController = {
  /** 🔹 Obtener todos los meseros */
  getMeseros: async (req, res) => {
    try {
      const { rows } = await db.query(`
        SELECT 
          id,
          nombre, 
          apellido, 
          username as usuario, 
          password as contrasena, 
          rol, 
          turno, 
          activo
        FROM meseros 
        ORDER BY id DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener meseros:', error);
      res.status(500).json({ error: 'Error al obtener meseros' });
    }
  },

  /** 🔹 Crear mesero - CORREGIDO */
  crearMesero: async (req, res) => {
    const { nombre, apellido, usuario, contrasena, rol, turno } = req.body;
    
    // ✅ VALIDACIONES
    if (!nombre || !apellido || !usuario || !contrasena || !rol || !turno) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
      // ✅ VERIFICAR SI EL USUARIO YA EXISTE
      const usuarioExistente = await db.query(
        'SELECT id FROM meseros WHERE username = $1', 
        [usuario]
      );
      
      if (usuarioExistente.rows.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }

      const query = `
        INSERT INTO meseros (nombre, apellido, username, password, rol, turno, activo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
          id,
          nombre, 
          apellido, 
          username as usuario, 
          password as contrasena, 
          rol, 
          turno, 
          activo
      `;
      const values = [nombre, apellido, usuario, contrasena, rol, turno, true];
      const { rows } = await db.query(query, values);
      
      console.log('✅ Mesero creado en BD:', rows[0]);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('❌ Error al crear mesero:', error);
      res.status(500).json({ error: 'Error al crear mesero en la base de datos' });
    }
  },

  /** 🔹 Actualizar mesero - CORREGIDO */
  actualizarMesero: async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, usuario, contrasena, rol, turno, activo } = req.body;
    
    try {
      // ✅ VERIFICAR SI EL MESERO EXISTE
      const meseroExistente = await db.query('SELECT id FROM meseros WHERE id = $1', [id]);
      if (meseroExistente.rows.length === 0) {
        return res.status(404).json({ error: 'Mesero no encontrado' });
      }

      // ✅ VERIFICAR SI EL NUEVO USUARIO YA EXISTE (excluyendo el actual)
      if (usuario) {
        const usuarioDuplicado = await db.query(
          'SELECT id FROM meseros WHERE username = $1 AND id != $2', 
          [usuario, id]
        );
        
        if (usuarioDuplicado.rows.length > 0) {
          return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
        }
      }

      const query = `
        UPDATE meseros
        SET 
          nombre = COALESCE($1, nombre),
          apellido = COALESCE($2, apellido),
          username = COALESCE($3, username),
          password = COALESCE($4, password),
          rol = COALESCE($5, rol),
          turno = COALESCE($6, turno),
          activo = COALESCE($7, activo)
        WHERE id = $8
        RETURNING 
          id,
          nombre, 
          apellido, 
          username as usuario, 
          password as contrasena, 
          rol, 
          turno, 
          activo
      `;
      const values = [nombre, apellido, usuario, contrasena, rol, turno, activo, id];
      const { rows } = await db.query(query, values);
      
      console.log('✅ Mesero actualizado en BD:', rows[0]);
      res.json(rows[0]);
    } catch (error) {
      console.error('❌ Error al actualizar mesero:', error);
      res.status(500).json({ error: 'Error al actualizar mesero' });
    }
  },

  /** 🔹 Eliminar mesero */
  eliminarMesero: async (req, res) => {
    const { id } = req.params;
    try {
      // ✅ VERIFICAR SI EL MESERO EXISTE
      const meseroExistente = await db.query('SELECT id FROM meseros WHERE id = $1', [id]);
      if (meseroExistente.rows.length === 0) {
        return res.status(404).json({ error: 'Mesero no encontrado' });
      }

      await db.query('DELETE FROM meseros WHERE id = $1', [id]);
      console.log('✅ Mesero eliminado de BD, ID:', id);
      res.json({ message: 'Mesero eliminado correctamente' });
    } catch (error) {
      console.error('❌ Error al eliminar mesero:', error);
      res.status(500).json({ error: 'Error al eliminar mesero' });
    }
  },

  /** 🔹 Activar/Desactivar mesero - CORREGIDO */
  toggleEstado: async (req, res) => {
    const { id } = req.params;
    try {
      const { rows } = await db.query('SELECT activo FROM meseros WHERE id = $1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Mesero no encontrado' });
      }
      
      const nuevoEstado = !rows[0].activo;
      const { rows: updatedRows } = await db.query(
        `UPDATE meseros SET activo = $1 WHERE id = $2 
         RETURNING 
           id,
           nombre, 
           apellido, 
           username as usuario, 
           password as contrasena, 
           rol, 
           turno, 
           activo`,
        [nuevoEstado, id]
      );
      
      console.log('✅ Estado de mesero actualizado:', updatedRows[0]);
      res.json(updatedRows[0]);
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      res.status(500).json({ error: 'Error al cambiar estado' });
    }
  }
};

module.exports = meseroController;