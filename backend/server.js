// backend/server.js
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // JSON grande para imágenes

// 🔹 Conexión a Supabase PostgreSQL
const db = new Pool({
  host: "aws-1-us-east-2.pooler.supabase.com", // tu host de Supabase
  port: 6543,                                    // puerto pooler
  database: "postgres",
  user: "postgres.sudpjidjsophvgdeyhkc",        // usuario completo con project id
  password: "#123987Aa#@21",                     // tu contraseña
  ssl: { rejectUnauthorized: false },            // obligatorio para conexión segura
});

// 🔹 Verificar conexión
db.connect()
  .then(() => console.log("✅ Conectado a Supabase PostgreSQL"))
  .catch((err) => console.error("❌ Error al conectar con Supabase:", err));

/////////////////////////////////////////////////
// 📌 CRUD de PLATILLOS
/////////////////////////////////////////////////
app.post("/platillos", async (req, res) => {
  const { nombre, descripcion, precio, imagen } = req.body;
  if (!nombre || !precio) return res.status(400).json({ error: "Faltan datos" });

  const buffer = imagen ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64") : null;

  try {
    const result = await db.query(
      "INSERT INTO Platillos (nombre, descripcion, precio, imagen) VALUES ($1, $2, $3, $4) RETURNING id_platillo",
      [nombre, descripcion, precio, buffer]
    );
    res.json({ message: "✅ Platillo guardado", id: result.rows[0].id_platillo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

app.get("/platillos", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Platillos");
    const platillos = result.rows.map((row) => {
      if (row.imagen) row.imagen = `data:image/png;base64,${row.imagen.toString("base64")}`;
      return row;
    });
    res.json(platillos);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener platillos" });
  }
});

app.put("/platillos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen } = req.body;

  const buffer = imagen ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64") : null;
  const sql = buffer
    ? "UPDATE Platillos SET nombre=$1, descripcion=$2, precio=$3, imagen=$4 WHERE id_platillo=$5"
    : "UPDATE Platillos SET nombre=$1, descripcion=$2, precio=$3 WHERE id_platillo=$4";

  const values = buffer ? [nombre, descripcion, precio, buffer, id] : [nombre, descripcion, precio, id];

  try {
    await db.query(sql, values);
    res.json({ message: "✅ Platillo actualizado" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

app.delete("/platillos/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM Platillos WHERE id_platillo=$1", [req.params.id]);
    res.json({ message: "✅ Platillo eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

/////////////////////////////////////////////////
// 📌 CRUD de BEBIDAS
/////////////////////////////////////////////////
app.post("/bebidas", async (req, res) => {
  const { nombre, descripcion, precio, imagen } = req.body;
  if (!nombre || !precio) return res.status(400).json({ error: "Faltan datos" });

  const buffer = imagen ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64") : null;

  try {
    const result = await db.query(
      "INSERT INTO Bebidas (nombre, descripcion, precio, imagen) VALUES ($1, $2, $3, $4) RETURNING id_bebida",
      [nombre, descripcion, precio, buffer]
    );
    res.json({ message: "✅ Bebida guardada", id: result.rows[0].id_bebida });
  } catch (err) {
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

app.get("/bebidas", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Bebidas");
    const bebidas = result.rows.map((row) => {
      if (row.imagen) row.imagen = `data:image/png;base64,${row.imagen.toString("base64")}`;
      return row;
    });
    res.json(bebidas);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener bebidas" });
  }
});

app.put("/bebidas/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen } = req.body;
  const buffer = imagen ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64") : null;
  const sql = buffer
    ? "UPDATE Bebidas SET nombre=$1, descripcion=$2, precio=$3, imagen=$4 WHERE id_bebida=$5"
    : "UPDATE Bebidas SET nombre=$1, descripcion=$2, precio=$3 WHERE id_bebida=$4";

  const values = buffer ? [nombre, descripcion, precio, buffer, id] : [nombre, descripcion, precio, id];

  try {
    await db.query(sql, values);
    res.json({ message: "✅ Bebida actualizada" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

app.delete("/bebidas/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM Bebidas WHERE id_bebida=$1", [req.params.id]);
    res.json({ message: "✅ Bebida eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

/////////////////////////////////////////////////
// 📌 CRUD de ESPECIALIDADES DEL MAR
/////////////////////////////////////////////////
app.post("/especialidades", async (req, res) => {
  const { nombre, descripcion, precio, imagen } = req.body;
  if (!nombre || !precio) return res.status(400).json({ error: "Faltan datos" });

  const buffer = imagen ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64") : null;

  try {
    const result = await db.query(
      "INSERT INTO Especialidades_mar (nombre, descripcion, precio, imagen) VALUES ($1, $2, $3, $4) RETURNING id_especialidad",
      [nombre, descripcion, precio, buffer]
    );
    res.json({ message: "✅ Especialidad guardada", id: result.rows[0].id_especialidad });
  } catch (err) {
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

app.get("/especialidades", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Especialidades_mar");
    const especialidades = result.rows.map((row) => {
      if (row.imagen) row.imagen = `data:image/png;base64,${row.imagen.toString("base64")}`;
      return row;
    });
    res.json(especialidades);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener especialidades" });
  }
});

app.put("/especialidades/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, imagen } = req.body;
  const buffer = imagen ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64") : null;
  const sql = buffer
    ? "UPDATE Especialidades_mar SET nombre=$1, descripcion=$2, precio=$3, imagen=$4 WHERE id_especialidad=$5"
    : "UPDATE Especialidades_mar SET nombre=$1, descripcion=$2, precio=$3 WHERE id_especialidad=$4";

  const values = buffer ? [nombre, descripcion, precio, buffer, id] : [nombre, descripcion, precio, id];

  try {
    await db.query(sql, values);
    res.json({ message: "✅ Especialidad actualizada" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

app.delete("/especialidades/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM Especialidades_mar WHERE id_especialidad=$1", [req.params.id]);
    res.json({ message: "✅ Especialidad eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

/////////////////////////////////////////////////
// 📌 CRUD de PROMOCIONES
/////////////////////////////////////////////////
app.post("/promociones", async (req, res) => {
  const { nombre, descripcion, imagen } = req.body;
  if (!nombre) return res.status(400).json({ error: "Faltan datos" });

  const buffer = imagen ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64") : null;

  try {
    const result = await db.query(
      "INSERT INTO Promociones (nombre, descripcion, imagen) VALUES ($1, $2, $3) RETURNING id_promocion",
      [nombre, descripcion, buffer]
    );
    res.json({ message: "✅ Promoción guardada", id: result.rows[0].id_promocion });
  } catch (err) {
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

app.get("/promociones", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM Promociones");
    const promociones = result.rows.map((row) => {
      if (row.imagen) row.imagen = `data:image/png;base64,${row.imagen.toString("base64")}`;
      return row;
    });
    res.json(promociones);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener promociones" });
  }
});

app.put("/promociones/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, imagen } = req.body;
  const buffer = imagen ? Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64") : null;

  const sql = buffer
    ? "UPDATE Promociones SET nombre=$1, descripcion=$2, imagen=$3 WHERE id_promocion=$4"
    : "UPDATE Promociones SET nombre=$1, descripcion=$2 WHERE id_promocion=$3";

  const values = buffer ? [nombre, descripcion, buffer, id] : [nombre, descripcion, id];

  try {
    await db.query(sql, values);
    res.json({ message: "✅ Promoción actualizada" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

app.delete("/promociones/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM Promociones WHERE id_promocion=$1", [req.params.id]);
    res.json({ message: "✅ Promoción eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

/////////////////////////////////////////////////
// 🚀 Iniciar servidor
/////////////////////////////////////////////////
app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});

