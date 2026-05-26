const oracledb = require('oracledb');
require('dotenv').config();

// Configuración de rendimiento: El formato de salida por defecto de Oracle es array. 
// Lo forzamos a JSON (Objetos) para que Node.js y Vue lo consuman directamente.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function initialize() {
    try {
        await oracledb.createPool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            // Dimensionamiento del pool para manejo de concurrencia
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 2
        });
        console.log('[Database] Pool de conexiones a Oracle 21c inicializado con éxito');
    } catch (err) {
        console.error('[Database] Error crítico al conectar con Oracle:', err.message);
        // Si la BD falla, el backend no debe arrancar
        process.exit(1); 
    }
}

// Función para consultas directas que exportaremos a los Repositorios
function getPool() {
    return oracledb.getPool();
}

module.exports = { initialize, getPool };