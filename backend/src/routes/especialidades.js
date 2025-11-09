const express = require('express');
const router = express.Router();
const especialidadesController = require('../controllers/especialidadesController');

// Rutas para especialidades
router.post('/', especialidadesController.crearEspecialidad);
router.get('/', especialidadesController.obtenerEspecialidades);
router.put('/:id', especialidadesController.actualizarEspecialidad);
router.delete('/:id', especialidadesController.eliminarEspecialidad);

// Rutas para stock de especialidades
router.get('/stock', especialidadesController.obtenerEspecialidadesConStock);
router.put('/stock/:id', especialidadesController.actualizarStockEspecialidad);

module.exports = router;