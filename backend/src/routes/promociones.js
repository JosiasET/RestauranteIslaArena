const express = require("express");
const router = express.Router();
const promocionesController = require("../controllers/promocionesController");

router.get("/", promocionesController.getAll);
router.post("/", promocionesController.create);
router.put("/:id", promocionesController.update);
router.delete("/:id", promocionesController.delete);

module.exports = router;