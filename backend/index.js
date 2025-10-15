require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ✅ Importar rutas
const platillosRoutes = require('./src/routes/platillos');
const bebidasRoutes = require('./src/routes/bebidasRoutes');
const especialidadesRoutes = require('./src/routes/especialidades');

// ✅ Usar rutas
app.use('/platillos', platillosRoutes);
app.use('/bebidas', bebidasRoutes);
app.use('/especialidades', especialidadesRoutes);

// ✅ Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Restaurante Isla Arena - Funcionando correctamente',
    status: 'OK',
    endpoints: {
      platillos: '/platillos',
      bebidas: '/bebidas',
      especialidades: '/especialidades'
    },
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(` Platillos: http://localhost:${PORT}/platillos`);
  console.log(` Bebidas: http://localhost:${PORT}/bebidas`);
  console.log(` Especialidades: http://localhost:${PORT}/especialidades`);
});
