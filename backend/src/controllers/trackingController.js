const db = require('../config/database');

const trackingController = {
  // ✅ NUEVO: Crear pedido completo (users + customers + order_tracking)
  createCompleteOrder: async (req, res) => {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      const { user_data, customer_data, order_data } = req.body;

      console.log('🔄 Creando pedido completo...');

      // 1. INSERTAR EN USERS
      const userResult = await client.query(
        `INSERT INTO users 
         (first_name, last_name, phone, email, user_type, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         RETURNING user_id`,
        [
          user_data.first_name,
          user_data.last_name,
          user_data.phone,
          user_data.email,
          user_data.user_type
        ]
      );

      const userId = userResult.rows[0].user_id;
      console.log('✅ Usuario creado ID:', userId);

      // 2. INSERTAR EN CUSTOMERS
      const customerResult = await client.query(
        `INSERT INTO customers 
         (user_id, address, city, state, postal_code, extra_references) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING customer_id`,
        [
          userId,
          customer_data.address,
          customer_data.city,
          customer_data.state,
          customer_data.postal_code,
          customer_data.extra_references
        ]
      );

      const customerId = customerResult.rows[0].customer_id;
      console.log('✅ Customer creado ID:', customerId);

      // 3. INSERTAR EN ORDER_TRACKING
      const orderResult = await client.query(
        `INSERT INTO order_tracking 
         (tracking_code, customer_id, order_items, total_amount, status, 
          payment_verified, payment_method, payment_reference, delivery_address,
          order_date, status_updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         RETURNING *`,
        [
          order_data.tracking_code,
          customerId,
          JSON.stringify(order_data.order_items),
          order_data.total_amount,
          order_data.status,
          order_data.payment_verified,
          order_data.payment_method,
          order_data.payment_reference || '',
          JSON.stringify(order_data.delivery_address)
        ]
      );

      await client.query('COMMIT');
      
      console.log('✅ Pedido completo creado:', orderResult.rows[0].tracking_code);
      
      res.status(201).json({
        success: true,
        order: orderResult.rows[0],
        tracking_code: order_data.tracking_code,
        user_id: userId,
        customer_id: customerId
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error en createCompleteOrder:', error);
      res.status(500).json({ 
        error: 'Error al crear el pedido completo: ' + error.message 
      });
    } finally {
      client.release();
    }
  },

  // Buscar pedido por código (ACTUALIZADO para joins)
  getOrderByCode: async (req, res) => {
    try {
      const { code } = req.params;
      
      const result = await db.query(
        `SELECT ot.*, 
                u.first_name, u.last_name, u.phone, u.email,
                c.address, c.city, c.state, c.postal_code
         FROM order_tracking ot
         JOIN customers c ON ot.customer_id = c.customer_id
         JOIN users u ON c.user_id = u.user_id
         WHERE ot.tracking_code = $1`,
        [code]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      
      // Formatear respuesta para el frontend
      const order = result.rows[0];
      const formattedOrder = {
        ...order,
        id: order.order_id, // ✅ AGREGAR esta línea para que el frontend tenga 'id'
        customer_name: `${order.first_name} ${order.last_name}`,
        customer_phone: order.phone,
        customer_email: order.email
      };
      
      res.json(formattedOrder);
    } catch (error) {
      console.error('Error en getOrderByCode:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  },

  // Obtener todos los pedidos (para admin) - ACTUALIZADO
  getAllOrders: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT ot.*, 
                u.first_name, u.last_name, u.phone, u.email,
                c.address, c.city, c.state, c.postal_code
         FROM order_tracking ot
         JOIN customers c ON ot.customer_id = c.customer_id
         JOIN users u ON c.user_id = u.user_id
         ORDER BY ot.order_date DESC`
      );
      
      // Formatear respuesta
      const formattedOrders = result.rows.map(order => ({
        ...order,
        id: order.order_id, // ✅ AGREGAR esta línea para que el frontend tenga 'id'
        customer_name: `${order.first_name} ${order.last_name}`,
        customer_phone: order.phone,
        customer_email: order.email
      }));
      
      res.json(formattedOrders);
    } catch (error) {
      console.error('Error en getAllOrders:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  },

  // ✅ NUEVO: Ruta para pedidos finalizados
  getCompletedOrders: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT ot.*, 
                u.first_name, u.last_name, u.phone, u.email,
                c.address, c.city, c.state, c.postal_code
         FROM order_tracking ot
         JOIN customers c ON ot.customer_id = c.customer_id
         JOIN users u ON c.user_id = u.user_id
         WHERE ot.status = 'finalizado'
         ORDER BY ot.order_date DESC`
      );
      
      const formattedOrders = result.rows.map(order => ({
        ...order,
        id: order.order_id,
        customer_name: `${order.first_name} ${order.last_name}`,
        customer_phone: order.phone,
        customer_email: order.email
      }));
      
      res.json(formattedOrders);
    } catch (error) {
      console.error('Error en getCompletedOrders:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  },

  // Crear nuevo pedido (MANTENER para compatibilidad)
  createOrder: async (req, res) => {
    try {
      const {
        tracking_code,
        customer_name,
        customer_phone,
        customer_email,
        order_items,
        total_amount,
        payment_method,
        payment_reference,
        delivery_address
      } = req.body;

      // Todos inician sin pago verificado
      let status = 'pedido_recibido';
      let payment_verified = false;

      const result = await db.query(
        `INSERT INTO order_tracking 
         (tracking_code, customer_name, customer_phone, customer_email, order_items, total_amount, status, payment_verified, payment_method, payment_reference, delivery_address) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [
          tracking_code,
          customer_name,
          customer_phone,
          customer_email || '',
          JSON.stringify(order_items),
          total_amount,
          status,
          payment_verified,
          payment_method,
          payment_reference || '',
          JSON.stringify(delivery_address)
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Error al crear el pedido' });
    }
  },

  // Actualizar estado del pedido
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, payment_verified } = req.body;

      console.log('🔄 Backend: Actualizando estado - ID:', id, 'Status:', status, 'Pago:', payment_verified);

      // Verificar que el ID sea un número válido
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        console.log('❌ ID inválido:', id);
        return res.status(400).json({ error: 'ID de pedido inválido' });
      }

      const result = await db.query(
        `UPDATE order_tracking 
         SET status = $1, payment_verified = $2, status_updated_at = NOW()
         WHERE order_id = $3  -- ✅ CAMBIAR id por order_id
         RETURNING *`,
        [status, payment_verified, orderId]
      );

      if (result.rows.length === 0) {
        console.log('❌ Pedido no encontrado ID:', orderId);
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      console.log('✅ Backend: Estado actualizado correctamente:', result.rows[0].tracking_code);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error updating order:', error);
      res.status(500).json({ error: 'Error al actualizar pedido: ' + error.message });
    }
  },

  // Actualizar solo el pago
  updatePaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { payment_verified } = req.body;

      console.log('🔄 Backend: Actualizando pago - ID:', id, 'Pago:', payment_verified);

      // Verificar que el ID sea un número válido
      const orderId = parseInt(id);
      if (isNaN(orderId)) {
        console.log('❌ ID inválido:', id);
        return res.status(400).json({ error: 'ID de pedido inválido' });
      }

      const result = await db.query(
        `UPDATE order_tracking 
         SET payment_verified = $1, status_updated_at = NOW()
         WHERE order_id = $2  -- ✅ CAMBIAR id por order_id
         RETURNING *`,
        [payment_verified, orderId]
      );

      if (result.rows.length === 0) {
        console.log('❌ Pedido no encontrado ID:', orderId);
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      console.log('✅ Backend: Pago actualizado correctamente:', result.rows[0].tracking_code);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error updating payment:', error);
      res.status(500).json({ error: 'Error al actualizar pago: ' + error.message });
    }
  }
};

module.exports = trackingController;