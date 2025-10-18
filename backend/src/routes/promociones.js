const express = require("express");
const router = express.Router();
const celebrateController = require("../controllers/celebrateController");

// Crear celebración
router.post("/", celebrateController.crearCelebracion);

// Obtener todas las celebraciones
router.get("/", celebrateController.obtenerCelebraciones);

module.exports = router;
