// index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuración de MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'Manuel_Ake',
    password: 'Manuel@123',
    database: 'isla_arena'
});

// Conexión a MySQL
db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos isla_arena');
});

// Ruta para obtener platillos
app.get('/platillos', (req, res) => {
    db.query('SELECT * FROM Platillos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Ruta para obtener bebidas
app.get('/bebidas', (req, res) => {
    db.query('SELECT * FROM Bebidas', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// Iniciar servidor
app.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3306');
});
