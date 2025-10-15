const express = require('express');
const router = express.Router();
const especialidadesController = require('../controllers/especialidadesController');

// CRUD Especialidades
router.post('/', especialidadesController.crearEspecialidad);
router.get('/', especialidadesController.obtenerEspecialidades);
router.put('/:id', especialidadesController.actualizarEspecialidad);
router.delete('/:id', especialidadesController.eliminarEspecialidad);

module.exports = router;
