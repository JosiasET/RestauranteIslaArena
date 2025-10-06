const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Configuración de la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'Manuel_Ake',
    password: 'Manuel@123',
    database: 'isla_arena',
    port: 3306
});

db.connect(err => {
    if(err) console.log('Error al conectar a MySQL:', err);
    else console.log('Conectado a MySQL');
});

// Rutas

// Obtener platillos
app.get('/platillos', (req, res) => {
    db.query('SELECT * FROM Platillos', (err, results) => {
        if(err) return res.status(500).json(err);
        res.json(results);
    });
});

// Agregar platillo
app.post('/platillos', (req, res) => {
    const { nombre, descripcion, precio, imagen } = req.body;
    db.query(
        'INSERT INTO Platillos (nombre, descripcion, precio, imagen) VALUES (?, ?, ?, ?)',
        [nombre, descripcion, precio, imagen],
        (err, result) => {
            if(err) return res.status(500).json(err);
            res.json({ id: result.insertId, nombre, descripcion, precio, imagen });
        }
    );
});

// Actualizar platillo
app.put('/platillos/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;
    db.query(
        'UPDATE Platillos SET nombre=?, descripcion=?, precio=?, imagen=? WHERE id_platillo=?',
        [nombre, descripcion, precio, imagen, id],
        (err) => {
            if(err) return res.status(500).json(err);
            res.json({ id, nombre, descripcion, precio, imagen });
        }
    );
});

// Eliminar platillo
app.delete('/platillos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM Platillos WHERE id_platillo=?', [id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({ message: 'Platillo eliminado' });
    });
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
