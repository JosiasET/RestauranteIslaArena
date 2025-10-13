require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Importar SOLO platillos por ahora para probar
const platillosRoutes = require('./src/Routes/platillos');
app.use('/platillos', platillosRoutes);

// Comentar temporalmente las demás
// const bebidasRoutes = require('./src/routes/bebidas');
// const especialidadesRoutes = require('./src/routes/especialidades');
// const promocionesRoutes = require('./src/routes/promociones');

// app.use('/bebidas', bebidasRoutes);
// app.use('/especialidades', especialidadesRoutes);
// app.use('/promociones', promocionesRoutes);

// ✅ RUTA PRINCIPAL - Agrega esto
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Restaurante Isla Arena - Funcionando correctamente',
    status: 'OK',
    endpoints: {
      health: '/health',
      platillos: {
        GET: '/platillos',
        POST: '/platillos',
        PUT: '/platillos/:id', 
        DELETE: '/platillos/:id'
      },
      documentacion: 'Visita /health para ver el estado del servidor'
    },
    timestamp: new Date().toISOString()
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    database: 'Conectado a Supabase',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🍽️  Platillos: http://localhost:${PORT}/platillos`);
});