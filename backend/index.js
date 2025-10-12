require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./src/config/bd');
const platillosRoutes = require('./src/routes/platillo'); // ← "platillo" SIN S

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Usar rutas
app.use('/platillos', platillosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🚀 Servidor funcionando correctamente' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});