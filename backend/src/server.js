const express = require('express');
const cors = require('cors');
const database = require('./config/db'); // Importamos el puente de conexión
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

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

app.get('/api/categorias', async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                id_categoria AS "id_categoria",
                nombre AS "nombre"
            FROM categoria
            ORDER BY nombre
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.get('/api/productos', async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                p.id_producto AS "id_producto",
                p.id_categoria AS "id_categoria",
                p.codigo_sku AS "codigo_sku",
                p.nombre AS "nombre",
                p.precio_unitario AS "precio",
                p.stock_actual AS "stock",
                p.ficha_tecnica AS "ficha_tecnica",
                p.url_galeria AS "imagen",
                c.nombre AS "categoria"
            FROM producto p
            LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
            ORDER BY p.nombre
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.get('/api/productos/:id', async (req, res, next) => {
    let connection;
    const idProducto = Number(req.params.id);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
        return res.status(400).json({
            estado: 'ERROR',
            mensaje: 'El id del producto no es valido'
        });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                p.id_producto AS "id_producto",
                p.id_categoria AS "id_categoria",
                p.codigo_sku AS "codigo_sku",
                p.nombre AS "nombre",
                p.precio_unitario AS "precio",
                p.stock_actual AS "stock",
                p.ficha_tecnica AS "ficha_tecnica",
                p.url_galeria AS "imagen",
                c.nombre AS "categoria"
            FROM producto p
            LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
            WHERE p.id_producto = :idProducto
        `, { idProducto });

        if (result.rows.length === 0) {
            return res.status(404).json({
                estado: 'ERROR',
                mensaje: 'Producto no encontrado'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

app.use((err, req, res, next) => {
    console.error('[API] Error:', err.message);
    res.status(500).json({
        estado: 'ERROR',
        mensaje: 'Error al procesar la solicitud'
    });
});

// Proceso de arranque secuencial
async function startup() {
    try {
        console.log('[Sistema] Iniciando secuencia de arranque...');
        
        // 1. Inicializar conexión a Oracle si esta habilitada
        if (process.env.DB_ENABLED === 'true') {
            await database.initialize();
        } else {
            console.log('[Database] Conexion a Oracle deshabilitada por DB_ENABLED=false');
        }
        
        // 2. Levantar servidor Express
        app.listen(PORT, () => {
            console.log(`[Backend] Servidor ejecutándose en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('[Sistema] Fallo catastrófico en el arranque:', err);
    }
}

startup();
