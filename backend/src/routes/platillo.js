const express = require("express");
const {
  getPlatillos,
  createPlatillo,
  updatePlatillo,
  deletePlatillo,
} = require("../controllers/Platillo.js");

const router = express.Router();

router.get("/", getPlatillos);
router.post("/", createPlatillo);
router.put("/:id", updatePlatillo);
router.delete("/:id", deletePlatillo);

module.exports = router;