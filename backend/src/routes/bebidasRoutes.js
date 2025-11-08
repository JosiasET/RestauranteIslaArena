const express = require('express');
const router = express.Router();
const bebidasController = require('../controllers/bebidasController');

// ✅ CRUD para bebidas (usa la tabla products)
router.post('/', bebidasController.crearBebida);
router.get('/', bebidasController.obtenerBebidas);
router.put('/:id', bebidasController.actualizarBebida);
router.delete('/:id', bebidasController.eliminarBebida);

// ✅ RUTAS PARA STOCK DE BEBIDAS
router.get('/stock', bebidasController.obtenerBebidasConStock);
router.put('/stock/:id', bebidasController.actualizarStockBebida);

// ✅ RUTAS GENERALES PARA STOCK (opcional)
router.get('/stock/todos', bebidasController.obtenerProductosConStock);
router.put('/stock/producto/:id', bebidasController.actualizarStock);

module.exports = router;