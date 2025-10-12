const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");


import platillosRoutes from "./routes/platillos.routes.js";
import bebidasRoutes from "./routes/bebidas.routes.js";
import especialidadesRoutes from "./routes/especialidades.routes.js";
import promocionesRoutes from "./routes/promociones.routes.js";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// ✅ Rutas
app.use("/api/platillos", platillosRoutes);
app.use("/api/bebidas", bebidasRoutes);
app.use("/api/especialidades", especialidadesRoutes);
app.use("/api/promociones", promocionesRoutes);

export default app;
