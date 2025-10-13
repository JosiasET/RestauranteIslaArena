const express = require("express");
const router = express.Router();
const especialidadesController = require("../controllers/especialidadesController");

router.get("/", especialidadesController.getAll);
router.post("/", especialidadesController.create);
router.put("/:id", especialidadesController.update);
router.delete("/:id", especialidadesController.delete);

module.exports = router;