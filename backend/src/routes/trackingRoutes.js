const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Ruta para buscar pedido por código
router.get('/:code', trackingController.getOrderByCode);

// Ruta para obtener todos los pedidos (admin) - solo activos por defecto
router.get('/', trackingController.getAllOrders);

// ✅ NUEVA RUTA: Pedidos finalizados
router.get('/completed', trackingController.getCompletedOrders);

// Ruta para crear nuevo pedido (vieja - mantener por compatibilidad)
router.post('/', trackingController.createOrder);

// Ruta para pedido completo
router.post('/complete', trackingController.createCompleteOrder);

// RUTAS PARA ADMIN
router.put('/:id/status', trackingController.updateOrderStatus);
router.put('/:id/payment', trackingController.updatePaymentStatus);

module.exports = router;