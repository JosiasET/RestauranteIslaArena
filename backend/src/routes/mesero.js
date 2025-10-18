// src/routes/mesero.js
const express = require('express');
const router = express.Router();
const meseroController = require('../controllers/meseroController');

router.get('/', meseroController.getMeseros);
router.post('/', meseroController.crearMesero);
router.put('/:id', meseroController.actualizarMesero);
router.delete('/:id', meseroController.eliminarMesero);
router.patch('/toggle/:id', meseroController.toggleEstado);

module.exports = router;
