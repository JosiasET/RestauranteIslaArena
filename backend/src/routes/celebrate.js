// src/routes/celebrate.js
const express = require('express');
const router = express.Router();
const celebrateController = require('../controllers/celebrateController');

router.post('/', celebrateController.crearCelebracion);
router.post('/verificar-disponibilidad', celebrateController.verificarDisponibilidad);
router.get('/', celebrateController.obtenerCelebraciones);
router.put('/:id/verificacion', celebrateController.actualizarVerificacion);
router.delete('/:id', celebrateController.eliminarCelebracion);

module.exports = router;