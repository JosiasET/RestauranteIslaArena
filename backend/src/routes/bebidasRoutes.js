// bebidasRoutes.js - AGREGAR NUEVAS RUTAS
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

// ✅ CRUD para bebidas (usa la tabla Productos)
router.post('/', productosController.crearProducto);
router.get('/', productosController.obtenerBebidas);
router.put('/:id', productosController.actualizarProducto);
router.delete('/:id', productosController.eliminarProducto);

// ✅ NUEVAS RUTAS PARA STOCK DE BEBIDAS
router.get('/stock', productosController.obtenerBebidasConStock);
router.put('/stock/:id', productosController.actualizarStockBebida);

module.exports = router;