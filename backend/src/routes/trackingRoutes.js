const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Ruta para buscar pedido por código
router.get('/:code', trackingController.getOrderByCode);

// Ruta para obtener todos los pedidos (admin)
router.get('/', trackingController.getAllOrders);

// Ruta para crear nuevo pedido
router.post('/', trackingController.createOrder);

// ✅ NUEVAS RUTAS PARA ADMIN
router.put('/:id/status', trackingController.updateOrderStatus);
router.put('/:id/payment', trackingController.updatePaymentStatus);

module.exports = router;