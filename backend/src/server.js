const express = require('express');
const cors = require('cors');
const database = require('./config/db'); // Importamos el puente de conexión
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta de diagnóstico
app.get('/api/health', (req, res) => {
    res.status(200).json({
        estado: 'OK',
        mensaje: 'Servidor Backend funcionando correctamente',
        timestamp: new Date()
    });
});

// Proceso de arranque secuencial
async function startup() {
    try {
        console.log('[Sistema] Iniciando secuencia de arranque...');
        
        // 1. Inicializar conexión a Oracle
       //  await database.initialize(); 
        
        // 2. Levantar servidor Express
        app.listen(PORT, () => {
            console.log(`[Backend] Servidor ejecutándose en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('[Sistema] Fallo catastrófico en el arranque:', err);
    }
}

startup();