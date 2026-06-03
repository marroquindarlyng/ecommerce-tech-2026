const oracledb = require('oracledb');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Configuración de rendimiento: El formato de salida por defecto de Oracle es array. 
// Lo forzamos a JSON (Objetos) para que Node.js y Vue lo consuman directamente.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];

async function initialize() {
    try {
        const requiredEnv = ['DB_USER', 'DB_PASSWORD', 'DB_CONNECTION_STRING'];
        const missingEnv = requiredEnv.filter((key) => !process.env[key]);
        const dbSchema = process.env.DB_SCHEMA;

        if (missingEnv.length > 0) {
            throw new Error(`Variables de entorno faltantes: ${missingEnv.join(', ')}`);
        }

        if (dbSchema && !/^[a-z][a-z0-9_$#]*$/i.test(dbSchema)) {
            throw new Error('DB_SCHEMA contiene caracteres invalidos');
        }

        const useThickMode = process.env.DB_USE_THICK === 'true' || Boolean(process.env.ORACLE_CLIENT_LIB_DIR);

        if (useThickMode) {
            const clientOptions = {
                configDir: process.env.TNS_ADMIN || undefined
            };

            if (process.env.ORACLE_CLIENT_LIB_DIR) {
                clientOptions.libDir = process.env.ORACLE_CLIENT_LIB_DIR;
            }

            oracledb.initOracleClient(clientOptions);
        }

        const poolConfig = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            // Dimensionamiento del pool para manejo de concurrencia
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 2
        };

        if (process.env.TNS_ADMIN && !useThickMode) {
            poolConfig.configDir = process.env.TNS_ADMIN;
            poolConfig.walletLocation = process.env.TNS_ADMIN;

            if (process.env.DB_WALLET_PASSWORD) {
                poolConfig.walletPassword = process.env.DB_WALLET_PASSWORD;
            }
        }

        if (dbSchema) {
            poolConfig.sessionCallback = (connection, requestedTag, callback) => {
                connection.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${dbSchema.toUpperCase()}`, (err) => {
                    callback(err);
                });
            };
        }

        await oracledb.createPool(poolConfig);
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
