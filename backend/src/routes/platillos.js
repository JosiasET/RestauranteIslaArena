const express = require("express");
const router = express.Router();
const {
  getAllPlatillos,
  createPlatillo
} = require("../controllers/platillosController");

router.get("/", getAllPlatillos);
router.post("/", createPlatillo);

// Comenta temporalmente estas rutas hasta que crees las funciones
// router.put("/:id", updatePlatillo);
// router.delete("/:id", deletePlatillo);

module.exports = router;