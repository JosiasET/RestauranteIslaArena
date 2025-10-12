import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import db from './src/config/bd.js';
import platillosRoutes from './src/routes/platillo.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Usar rutas
app.use('/platillos', platillosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🚀 Servidor funcionando correctamente' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});