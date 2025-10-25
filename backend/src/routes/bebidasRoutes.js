const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

// ✅ CRUD para bebidas (usa la tabla Productos)
router.post('/', productosController.crearProducto);
router.get('/', productosController.obtenerBebidas);
router.put('/:id', productosController.actualizarProducto);
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;
