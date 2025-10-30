// especialidades.js - ESTÁ CORRECTO
const express = require('express');
const router = express.Router();
const especialidadesController = require('../controllers/especialidadesController');

// Rutas existentes...
router.post('/', especialidadesController.crearEspecialidad);
router.get('/', especialidadesController.obtenerEspecialidades);
router.put('/:id', especialidadesController.actualizarEspecialidad);
router.delete('/:id', especialidadesController.eliminarEspecialidad);

// ✅ NUEVAS RUTAS PARA STOCK DE ESPECIALIDADES
router.get('/stock', especialidadesController.obtenerEspecialidadesConStock);
router.put('/stock/:id', especialidadesController.actualizarStockEspecialidad);

module.exports = router;