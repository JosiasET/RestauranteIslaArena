// src/routes/celebrateRoutes.js
const express = require('express');
const router = express.Router();
const celebrateController = require('../controllers/celebrateController');

router.post('/', celebrateController.crearCelebracion);
router.get('/', celebrateController.obtenerCelebraciones);

module.exports = router;
