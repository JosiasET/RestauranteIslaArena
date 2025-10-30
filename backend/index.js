require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// ✅ Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ✅ Importar rutas
const platillosRoutes = require('./src/routes/platillos');
const bebidasRoutes = require('./src/routes/bebidasRoutes');
const especialidadesRoutes = require('./src/routes/especialidades');
const promocionesRoutes = require('./src/routes/promociones');
const celebrateRoutes = require('./src/routes/celebrate');
const meseroRoutes = require('./src/routes/mesero'); // ✅ NUEVO: mesero

// ✅ Usar rutas
app.use('/platillos', platillosRoutes);
app.use('/bebidas', bebidasRoutes);
app.use('/especialidades', especialidadesRoutes);
app.use('/promociones', promocionesRoutes);
app.use('/celebrate', celebrateRoutes);
app.use('/mesero', meseroRoutes); // ✅ endpoint mesero

// ✅ Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Restaurante Isla Arena - Funcionando correctamente',
    status: 'OK',
    endpoints: {
      platillos: '/platillos',
      bebidas: '/bebidas',
      especialidades: '/especialidades',
      promociones: '/promociones',
      celebrate: '/celebrate',
      mesero: '/mesero' // ✅ endpoint mesero
    },
    timestamp: new Date().toISOString()
  });
});

// ✅ Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('=============================================');
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log('🧩 Endpoints disponibles:');
  console.log(`   🍽️ Platillos:       http://localhost:${PORT}/platillos`);
  console.log(`   🥤 Bebidas:         http://localhost:${PORT}/bebidas`);
  console.log(`   🍝 Especialidades:  http://localhost:${PORT}/especialidades`);
  console.log(`   🎁 Promociones:     http://localhost:${PORT}/promociones`);
  console.log(`   🎉 Celebrate:       http://localhost:${PORT}/celebrate`);
  console.log(`   👨‍💼 Mesero:         http://localhost:${PORT}/mesero`); // ✅ mesero
  console.log('=============================================');
});

const trackingRoutes = require('./src/routes/trackingRoutes');

// ✅ Después de los otros app.use()
app.use('/tracking', trackingRoutes);
