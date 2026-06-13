const express = require('express');
const router = express.Router();
const database = require('./config/db');

// ========================================================
// 1. GET /api/categoria -> LISTAR TODAS LAS CATEGORÍAS
// ========================================================
router.get('/api/categoria', async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();

        // Obtenemos las categorías ordenadas alfabéticamente para el catálogo
        const result = await connection.execute(`
            SELECT 
                ID_CATEGORIA AS "id_categoria",
                NOMBRE AS "nombre"
            FROM ADMIN.CATEGORIA
            ORDER BY NOMBRE ASC
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 2. GET /api/categoria/:id -> OBTENER UNA CATEGORÍA POR ID
// ========================================================
router.get('/api/categoria/:id', async (req, res, next) => {
    let connection;
    const idCategoria = Number(req.params.id);

    if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID de la categoría no es válido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT 
                ID_CATEGORIA AS "id_categoria",
                NOMBRE AS "nombre"
            FROM ADMIN.CATEGORIA
            WHERE ID_CATEGORIA = :idCategoria
        `, { idCategoria });

        if (result.rows.length === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Categoría no encontrada.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 3. POST /api/categoria -> CREAR UN NUEVO REGISTRO
// ========================================================
router.post('/api/categoria', async (req, res, next) => {
    let connection;
    const { nombre } = req.body;

    // --- REGLA 10: INFORMACIÓN MÍNIMA OBLIGATORIA ---
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 10: El nombre de la categoría es obligatorio.' });
    }

    try {
        connection = await database.getPool().getConnection();

        // Omitimos ID_CATEGORIA ya que Oracle usa su secuencia nativa identity
        const sql = `
            INSERT INTO CATEGORIA (
                NOMBRE
            ) VALUES (
                :nombre
            ) RETURNING ID_CATEGORIA INTO :out_id
        `;

        const bindParams = {
            nombre: nombre.trim(),
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT }
        };

        const result = await connection.execute(sql, bindParams, { autoCommit: true });

        res.status(201).json({
            estado: 'OK',
            mensaje: 'Categoría registrada exitosamente.',
            data: {
                id_categoria: result.outBinds.out_id[0],
                nombre: nombre.trim()
            }
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 4. PUT /api/categoria/:id -> ACTUALIZACIÓN INTEGRAL
// ========================================================
router.put('/api/categoria/:id', async (req, res, next) => {
    let connection;
    const idCategoria = Number(req.params.id);
    const { nombre } = req.body;

    if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID de la categoría no es válido.' });
    }

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El nombre es requerido para actualizar la categoría.' });
    }

    try {
        connection = await database.getPool().getConnection();

        const sql = `
            UPDATE CATEGORIA
            SET NOMBRE = :nombre
            WHERE ID_CATEGORIA = :idCategoria
        `;

        const result = await connection.execute(sql, {
            nombre: nombre.trim(),
            idCategoria
        }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'La categoría que intenta modificar no existe.' });
        }

        res.json({
            estado: 'OK',
            mensaje: `Categoría con ID ${idCategoria} modificada correctamente.`
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;