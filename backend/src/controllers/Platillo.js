const db = require("../config/bd.js");

// Obtener todos los platillos
const getPlatillos = (req, res) => {
  db.query("SELECT * FROM Platillos", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// Agregar platillo
const createPlatillo = (req, res) => {
  const { nombre, descripcion, precio, imagen } = req.body;
  db.query(
    "INSERT INTO Platillos (nombre, descripcion, precio, imagen) VALUES (?, ?, ?, ?)",
    [nombre, descripcion, precio, imagen],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ id: result.insertId, nombre, descripcion, precio, imagen });
    }
  );
};

// Actualizar platillo
const updatePlatillo = (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen } = req.body;
  db.query(
    "UPDATE Platillos SET nombre=?, descripcion=?, precio=?, imagen=? WHERE id_platillo=?",
    [nombre, descripcion, precio, imagen, id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ id, nombre, descripcion, precio, imagen });
    }
  );
};

// Eliminar platillo
const deletePlatillo = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM Platillos WHERE id_platillo=?", [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Platillo eliminado" });
  });
};

module.exports = {
  getPlatillos,
  createPlatillo,
  updatePlatillo,
  deletePlatillo
};