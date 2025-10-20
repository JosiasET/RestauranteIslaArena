// src/routes/celebrateRoutes.js
const express = require('express');
const router = express.Router();
const celebrateController = require('../controllers/celebrateController');

router.post('/', celebrateController.crearCelebracion);
router.get('/', celebrateController.obtenerCelebraciones);
router.put('/:id/verificacion', celebrateController.actualizarVerificacion);
router.delete('/:id', celebrateController.eliminarCelebracion); // <- Esta línea debe estar

module.exports = router;