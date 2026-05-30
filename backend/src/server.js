const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const database = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ estado: 'OK', mensaje: 'Servidor Backend funcionando correctamente', timestamp: new Date() });
});

app.get('/api/productos', (req, res) => {
    const rutaArchivo = path.join(__dirname, 'productos.json');
    fs.readFile(rutaArchivo, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "No se pudo cargar la lista de productos" });
        res.json(JSON.parse(data));
    });
});

app.patch('/api/productos/:id/stock', (req, res) => {
    const idProducto = parseInt(req.params.id);
    const nuevoStock = req.body.stock;
    if (nuevoStock === undefined || typeof nuevoStock !== 'number' || nuevoStock < 0) {
        return res.status(400).json({ error: "Stock invalido." });
    }
    const rutaArchivo = path.join(__dirname, 'productos.json');
    fs.readFile(rutaArchivo, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Error al leer la base de datos." });
        let productos = JSON.parse(data);
        const idx = productos.findIndex(p => p.id === idProducto);
        if (idx === -1) return res.status(404).json({ error: "Producto no encontrado." });
        productos[idx].stock.actual = nuevoStock;
        fs.writeFile(rutaArchivo, JSON.stringify(productos, null, 2), 'utf8', (errWrite) => {
            if (errWrite) return res.status(500).json({ error: "Error al guardar." });
            res.json({ mensaje: "Stock actualizado con exito", producto: productos[idx] });
        });
    });
});

async function startup() {
    try {
        console.log('[Sistema] Iniciando secuencia de arranque...');
        app.listen(PORT, () => {
            console.log('[Backend] Servidor ejecutandose en http://localhost:' + PORT);
        });
    } catch (err) {
        console.error('[Sistema] Fallo catastrofico en el arranque:', err);
    }
}

startup();
