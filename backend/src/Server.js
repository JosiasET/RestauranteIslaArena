const express = require("express");
const cors = require("cors");

const app = express();

// Middleware global
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Importar rutas
const platillosRoutes = require('./routes/platillosRoutes');
const bebidasRoutes = require('./routes/bebidasRoutes');
const especialidadesRoutes = require('./routes/especialidadesRoutes');
const promocionesRoutes = require('./routes/promocionesRoutes');

// Usar rutas
app.use('/api/platillos', platillosRoutes);
app.use('/api/bebidas', bebidasRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/promociones', promocionesRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧩 Servidor modular corriendo en http://localhost:${PORT}`);
});