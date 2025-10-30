const db = require('../config/database');

const trackingController = {
  // Buscar pedido por código
  getOrderByCode: async (req, res) => {
    try {
      const { code } = req.params;
      
      const result = await db.query(
        'SELECT * FROM order_tracking WHERE tracking_code = $1',
        [code]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error del servidor' });
    }
  },

  // Obtener todos los pedidos (para admin)
  getAllOrders: async (req, res) => {
    try {
      const result = await db.query(
        'SELECT * FROM order_tracking ORDER BY order_date DESC'
      );
      
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: 'Error del servidor' });
    }
  },

  // Crear nuevo pedido
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

  // ✅ NUEVO: Actualizar estado del pedido
  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, payment_verified } = req.body;

      const result = await db.query(
        `UPDATE order_tracking 
         SET status = $1, payment_verified = $2, status_updated_at = NOW()
         WHERE id = $3 
         RETURNING *`,
        [status, payment_verified, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ error: 'Error al actualizar pedido' });
    }
  },

  // ✅ NUEVO: Actualizar solo el pago
  updatePaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { payment_verified } = req.body;

      const result = await db.query(
        `UPDATE order_tracking 
         SET payment_verified = $1, status_updated_at = NOW()
         WHERE id = $2 
         RETURNING *`,
        [payment_verified, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({ error: 'Error al actualizar pago' });
    }
  }
};

module.exports = trackingController;