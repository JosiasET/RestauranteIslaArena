// src/controllers/celebrateController.js - VERSIÓN COMPLETA CORREGIDA
const db = require("../config/database");

// ✅ FUNCIÓN PARA OBTENER FRANJA HORARIA (FUERA del controlador)
function obtenerFranjaHoraria(hora) {
  const horaNum = parseInt(hora.split(':')[0]);
  
  if (horaNum >= 10 && horaNum < 13) return { inicio: 10, fin: 13, nombre: '10:00-13:00' };
  if (horaNum >= 13 && horaNum < 16) return { inicio: 13, fin: 16, nombre: '13:00-16:00' };
  if (horaNum >= 16 && horaNum < 19) return { inicio: 16, fin: 19, nombre: '16:00-19:00' };
  
  return null; // Fuera del horario
}

const celebrateController = {
  crearCelebracion: async (req, res) => {
    try {
      console.log('📥 Datos recibidos en backend:', req.body);
      
      const { 
        firstName,           
        lastName,              
        first_name,          
        last_name,           
        fecha_nacimiento, 
        telefono, 
        fecha_preferida, 
        hora_preferida, 
        acepta_verificacion,
        cant_people
      } = req.body;

      // Usar firstName/lastName o first_name/last_name
      const nombre = firstName || first_name;
      const apellido = lastName || last_name;

      // Validaciones
      if (!nombre || !apellido || !fecha_nacimiento || !telefono || !fecha_preferida || !hora_preferida) {
        return res.status(400).json({ 
          error: "Todos los campos son requeridos"
        });
      }

      if (cant_people > 10) {
        return res.status(400).json({ 
          error: "Máximo 10 personas por reservación"
        });
      }

      // ✅ VERIFICAR CAPACIDAD POR FRANJA CORREGIDA
      const franja = obtenerFranjaHoraria(hora_preferida);
      if (!franja) {
        return res.status(400).json({ 
          error: "❌ Horario no disponible - El restaurante solo opera de 10:00 a 19:00"
        });
      }

      const capacidadResult = await db.query(
        `SELECT COALESCE(SUM(people_count), 0) as total_reservado
         FROM reservations_celebration 
         WHERE preferred_date = $1 
           AND EXTRACT(HOUR FROM preferred_time) >= $2
           AND EXTRACT(HOUR FROM preferred_time) < $3
           AND reservation_status != 'cancelada'`,
        [fecha_preferida, franja.inicio, franja.fin]
      );

      const totalReservado = parseInt(capacidadResult.rows[0].total_reservado);
      const capacidadRestante = 30 - totalReservado;
      const personasSolicitadas = parseInt(cant_people) || 1;

      if (capacidadRestante < personasSolicitadas) {
        return res.status(400).json({ 
          error: `❌ Capacidad llena en la franja ${franja.nombre} - Solo quedan ${capacidadRestante} lugares`,
          capacidad_restante: capacidadRestante,
          franja_horaria: franja.nombre
        });
      }

      // 1. CREAR USUARIO en tabla users - SIN PASSWORD
      const userResult = await db.query(
        `INSERT INTO users (first_name, last_name, phone, email, user_type, created_at, username)
         VALUES ($1, $2, $3, $4, 'customer', NOW(), $5)
         RETURNING user_id`,
        [
          nombre,
          apellido,
          telefono,
          `celebrate_${Date.now()}@islaarena.com`,
          `celebrate_${Date.now()}`
        ]
      );
      const userId = userResult.rows[0].user_id;

      // 2. CREAR CUSTOMER mínimo
      const customerResult = await db.query(
        `INSERT INTO customers (user_id, address, city, state, postal_code, extra_references)
         VALUES ($1, 'No especificada', 'No especificada', 'No especificada', '00000', 'Reserva Celebrate')
         RETURNING customer_id`,
        [userId]
      );
      const customerId = customerResult.rows[0].customer_id;

      // 3. CREAR RESERVA en reservations_celebration
      const reservaResult = await db.query(
        `INSERT INTO reservations_celebration (
          customer_id,
          preferred_date,
          preferred_time, 
          people_count,
          accepts_verification,
          verification_status,
          reservation_status,
          notes,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING celebration_id`,
        [
          customerId,
          fecha_preferida,
          hora_preferida,
          cant_people,
          acepta_verificacion,
          false,
          'pendiente',
          `Fecha de nacimiento: ${fecha_nacimiento}`
        ]
      );

      const celebrationId = reservaResult.rows[0].celebration_id;

      // Generar código de reserva
      const reservationCode = 'CEL' + Math.random().toString(36).substr(2, 6).toUpperCase();

      console.log('✅ Reserva creada exitosamente en BD');
      res.json({ 
        message: '✅ Reserva creada exitosamente', 
        data: {
          celebration_id: celebrationId,
          reservation_code: reservationCode,
          capacidad_restante: capacidadRestante - personasSolicitadas,
          first_name: nombre,
          last_name: apellido,
          fecha_preferida: fecha_preferida,
          hora_preferida: hora_preferida,
          cant_people: cant_people
        }
      });
      
    } catch (err) {
      console.error('❌ Error en crearCelebracion:', err);
      res.status(500).json({ 
        error: "Error al guardar la celebración",
        detalle: err.message
      });
    }
  },

  obtenerCelebraciones: async (req, res) => {
    try {
      console.log('📋 Solicitando todas las celebraciones');
      
      const result = await db.query(`
        SELECT 
          rc.celebration_id,
          rc.preferred_date as fecha_preferida,
          rc.preferred_time as hora_preferida,
          rc.people_count as cant_people,
          rc.verification_status as estado_verificacion,
          rc.reservation_status,
          rc.created_at,
          rc.notes,
          u.first_name,
          u.last_name,
          u.phone
        FROM reservations_celebration rc
        JOIN customers c ON rc.customer_id = c.customer_id
        JOIN users u ON c.user_id = u.user_id
        ORDER BY rc.created_at DESC
      `);
      
      console.log(`✅ ${result.rows.length} celebraciones encontradas`);
      
      // Transformar los datos para el frontend
      const celebracionesTransformadas = result.rows.map(row => ({
        celebration_id: row.celebration_id,
        nombre_completo: `${row.first_name} ${row.last_name}`,
        first_name: row.first_name,
        last_name: row.last_name,
        telefono: row.phone,
        fecha_preferida: row.fecha_preferida,
        hora_preferida: row.hora_preferida,
        cant_people: row.cant_people,
        estado_verificacion: row.estado_verificacion,
        reservation_status: row.reservation_status,
        created_at: row.created_at,
        notes: row.notes
      }));
      
      res.json(celebracionesTransformadas);
    } catch (err) {
      console.error('❌ Error en obtenerCelebraciones:', err);
      res.status(500).json({ 
        error: "Error al obtener celebraciones",
        detalle: err.message
      });
    }
  },

  verificarDisponibilidad: async (req, res) => {
    try {
      const { fecha_preferida, hora_preferida, cant_people } = req.body;
      
      if (!fecha_preferida || !hora_preferida) {
        return res.status(400).json({ error: "Fecha y hora requeridas" });
      }

      // ✅ VERIFICAR CAPACIDAD POR FRANJA CORREGIDA
      const franja = obtenerFranjaHoraria(hora_preferida);
      if (!franja) {
        return res.status(400).json({ 
          error: "❌ Horario no disponible - El restaurante solo opera de 10:00 a 19:00"
        });
      }

      const capacidadResult = await db.query(
        `SELECT COALESCE(SUM(people_count), 0) as total_reservado
         FROM reservations_celebration 
         WHERE preferred_date = $1 
           AND EXTRACT(HOUR FROM preferred_time) >= $2
           AND EXTRACT(HOUR FROM preferred_time) < $3
           AND reservation_status != 'cancelada'`,
        [fecha_preferida, franja.inicio, franja.fin]
      );

      const totalReservado = parseInt(capacidadResult.rows[0].total_reservado);
      const capacidadRestante = 30 - totalReservado;
      const personasSolicitadas = parseInt(cant_people) || 1;
      const disponible = capacidadRestante >= personasSolicitadas;

      res.json({
        disponible,
        mensaje: disponible 
          ? `✅ Disponible - ${capacidadRestante} personas restantes en ${franja.nombre}`
          : `❌ Capacidad llena en ${franja.nombre} - Solo quedan ${capacidadRestante} lugares`,
        capacidad_restante: capacidadRestante,
        total_reservado: totalReservado,
        franja_horaria: franja.nombre
      });
    } catch (err) {
      console.error('❌ Error verificando disponibilidad:', err);
      res.status(500).json({ 
        error: "Error al verificar disponibilidad",
        detalle: err.message
      });
    }
  },

  actualizarVerificacion: async (req, res) => {
    try {
      const { id } = req.params;
      const { ine_verificacion, estado_verificacion } = req.body;

      console.log(`🔄 Actualizando verificación ID: ${id}`, req.body);

      const result = await db.query(
        `UPDATE reservations_celebration 
         SET ine_verified = $1, verification_status = $2 
         WHERE celebration_id = $3 
         RETURNING *`,
        [ine_verificacion, estado_verificacion, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Celebración no encontrada" });
      }

      console.log('✅ Verificación actualizada:', result.rows[0]);
      res.json({ 
        message: "✅ Verificación actualizada", 
        data: result.rows[0] 
      });
    } catch (err) {
      console.error('❌ Error en actualizarVerificacion:', err);
      res.status(500).json({ 
        error: "Error al actualizar verificación",
        detalle: err.message
      });
    }
  },

  eliminarCelebracion: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Eliminando celebración ID: ${id}`);

      const result = await db.query(
        'DELETE FROM reservations_celebration WHERE celebration_id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Celebración no encontrada" });
      }

      console.log('✅ Celebración eliminada:', result.rows[0]);
      res.json({ 
        message: "✅ Celebración eliminada", 
        data: result.rows[0] 
      });
    } catch (err) {
      console.error('❌ Error en eliminarCelebracion:', err);
      res.status(500).json({ 
        error: "Error al eliminar celebración",
        detalle: err.message
      });
    }
  }
};

module.exports = celebrateController;