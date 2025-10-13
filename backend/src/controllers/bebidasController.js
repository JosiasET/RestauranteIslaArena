const db = require('../config/database');
const { processImage, formatImageResponse } = require('../utils/imageUtils');

const bebidasController = {
  crearBebida: async (req, res) => {
    const { nombre, descripcion, precio, imagen } = req.body;
    if (!nombre || !precio) return res.status(400).json({ error: "Nombre y precio son requeridos" });

    try {
      const buffer = processImage(imagen);
      const result = await db.query(
        "INSERT INTO Bebidas (nombre, descripcion, precio, imagen) VALUES ($1, $2, $3, $4) RETURNING *",
        [nombre, descripcion, precio, buffer]
      );
      
      const bebida = formatImageResponse(result.rows)[0];
      res.json({ message: "Bebida creada", data: bebida });
    } catch (err) {
      res.status(500).json({ error: "Error al crear bebida" });
    }
  },

  obtenerBebidas: async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM Bebidas ORDER BY id_bebida");
      const bebidas = formatImageResponse(result.rows);
      res.json(bebidas);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener bebidas" });
    }
  },

};

module.exports = bebidasController;