const express = require('express');
const router = express.Router();
const platillosController = require('../controllers/platillosController');

// CRUD de platillos
router.post('/', platillosController.crearPlatillo);
router.get('/', platillosController.obtenerPlatillos);
router.put('/:id', platillosController.actualizarPlatillo);
router.delete('/:id', platillosController.eliminarPlatillo);

module.exports = router;