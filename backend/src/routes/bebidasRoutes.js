const express = require('express');
const router = express.Router();
const bebidasController = require('../controllers/bebidasController');

router.post('/', bebidasController.crearBebida);
router.get('/', bebidasController.obtenerBebidas);
router.put('/:id', bebidasController.actualizarBebida);
router.delete('/:id', bebidasController.eliminarBebida);

module.exports = router;