// src/controllers/meseroController.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const meseroController = {
  /** 🔹 Obtener todos los meseros */
  getMeseros: async (req, res) => {
    try {
      const { rows } = await db.query(`
        SELECT 
          u.user_id as id,
          u.first_name as nombre,
          u.last_name as apellido,
          u.username as usuario,
          u.password as contrasena,
          e.role as rol,
          e.shift as turno,
          e.is_active as activo
        FROM users u
        INNER JOIN employees e ON u.user_id = e.user_id
        WHERE e.role = 'mesero'
        ORDER BY u.user_id DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener meseros:', error);
      res.status(500).json({ error: 'Error al obtener meseros' });
    }
  },

  /** 🔹 Crear mesero - VERSIÓN SIMPLIFICADA */
  crearMesero: async (req, res) => {
    const { nombre, apellido, usuario, contrasena, turno } = req.body;
    
    // ✅ VALIDACIONES BÁSICAS
    if (!nombre || !apellido || !usuario || !contrasena || !turno) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
      // ✅ VERIFICAR SI EL USUARIO YA EXISTE
      const usuarioExistente = await db.query(
        'SELECT user_id FROM users WHERE username = $1', 
        [usuario]
      );
      
      if (usuarioExistente.rows.length > 0) {
        return res.status(400).json({ error: 'El nombre de usuario ya existe' });
      }

      // Encriptar contraseña de forma simple
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      // 1. Insertar en tabla USERS
      const userQuery = `
        INSERT INTO users (first_name, last_name, username, email, password, user_type, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING user_id
      `;
      const userValues = [
        nombre, 
        apellido, 
        usuario, 
        `${usuario}@restaurante.com`,
        hashedPassword, 
        'employee',
        '000-000-0000'
      ];
      
      const userResult = await db.query(userQuery, userValues);
      const userId = userResult.rows[0].user_id;

      // 2. Insertar en tabla EMPLOYEES
      const employeeQuery = `
        INSERT INTO employees (user_id, role, shift, salary, hire_date, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING employee_id
      `;
      const employeeValues = [
        userId,
        'mesero',
        turno,
        0,
        new Date(),
        true
      ];
      
      await db.query(employeeQuery, employeeValues);

      // Devolver el mesero creado
      const { rows } = await db.query(`
        SELECT 
          u.user_id as id,
          u.first_name as nombre,
          u.last_name as apellido,
          u.username as usuario,
          u.password as contrasena,
          e.role as rol,
          e.shift as turno,
          e.is_active as activo
        FROM users u
        INNER JOIN employees e ON u.user_id = e.user_id
        WHERE u.user_id = $1
      `, [userId]);
      
      console.log('✅ Mesero creado en BD:', rows[0]);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('❌ Error al crear mesero:', error);
      res.status(500).json({ error: 'Error al crear mesero: ' + error.message });
    }
  },

  /** 🔹 Actualizar mesero */
  actualizarMesero: async (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, usuario, turno, activo } = req.body;
    
    try {
      // 1. Actualizar tabla USERS
      const userQuery = `
        UPDATE users 
        SET first_name = $1, last_name = $2, username = $3
        WHERE user_id = $4
      `;
      await db.query(userQuery, [nombre, apellido, usuario, id]);

      // 2. Actualizar tabla EMPLOYEES
      const employeeQuery = `
        UPDATE employees 
        SET shift = $1, is_active = $2
        WHERE user_id = $3
      `;
      await db.query(employeeQuery, [turno, activo, id]);

      // Devolver el mesero actualizado
      const { rows } = await db.query(`
        SELECT 
          u.user_id as id,
          u.first_name as nombre,
          u.last_name as apellido,
          u.username as usuario,
          u.password as contrasena,
          e.role as rol,
          e.shift as turno,
          e.is_active as activo
        FROM users u
        INNER JOIN employees e ON u.user_id = e.user_id
        WHERE u.user_id = $1
      `, [id]);
      
      console.log('✅ Mesero actualizado:', rows[0]);
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
      // Eliminar de employees primero
      await db.query('DELETE FROM employees WHERE user_id = $1', [id]);
      // Luego eliminar de users
      await db.query('DELETE FROM users WHERE user_id = $1', [id]);
      
      console.log('✅ Mesero eliminado, ID:', id);
      res.json({ message: 'Mesero eliminado correctamente' });
    } catch (error) {
      console.error('❌ Error al eliminar mesero:', error);
      res.status(500).json({ error: 'Error al eliminar mesero' });
    }
  },

  /** 🔹 Activar/Desactivar mesero */
  toggleEstado: async (req, res) => {
    const { id } = req.params;
    try {
      // Obtener estado actual
      const { rows } = await db.query(
        'SELECT is_active FROM employees WHERE user_id = $1', 
        [id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Mesero no encontrado' });
      }
      
      const nuevoEstado = !rows[0].is_active;
      
      // Actualizar estado
      await db.query(
        'UPDATE employees SET is_active = $1 WHERE user_id = $2',
        [nuevoEstado, id]
      );
      
      // Devolver mesero actualizado
      const { rows: updatedRows } = await db.query(`
        SELECT 
          u.user_id as id,
          u.first_name as nombre,
          u.last_name as apellido,
          u.username as usuario,
          e.role as rol,
          e.shift as turno,
          e.is_active as activo
        FROM users u
        INNER JOIN employees e ON u.user_id = e.user_id
        WHERE u.user_id = $1
      `, [id]);
      
      console.log('✅ Estado actualizado:', updatedRows[0]);
      res.json(updatedRows[0]);
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      res.status(500).json({ error: 'Error al cambiar estado' });
    }
  }
};

module.exports = meseroController;