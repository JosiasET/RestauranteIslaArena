const express = require('express');
const router = express.Router();
const bebidasController = require('../controllers/bebidasController');

// CRUD de bebidas
router.post('/', bebidasController.crearBebida);
router.get('/', bebidasController.obtenerBebidas);
router.put('/:id', bebidasController.actualizarBebida);
router.delete('/:id', bebidasController.eliminarBebida);

module.exports = router;
