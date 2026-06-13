const express = require('express');
const router = express.Router();
const database = require('./config/db');

// ========================================================
// 1. GET /api/cliente -> LISTAR TODOS LOS CLIENTES
// ========================================================
router.get('/api/cliente', async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();

        const result = await connection.execute(`
            SELECT 
                ID_CLIENTE AS "id_cliente",
                NIT AS "nit",
                NOMBRE_COMPLETO AS "nombre_completo",
                CORREO AS "correo",
                DIRECCION_ENVIO AS "direccion_envio"
            FROM ADMIN.CLIENTE
            ORDER BY NOMBRE_COMPLETO ASC
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 2. GET /api/cliente/:id -> OBTENER UN CLIENTE POR ID
// ========================================================
router.get('/api/cliente/:id', async (req, res, next) => {
    let connection;
    const idCliente = Number(req.params.id);

    if (!Number.isInteger(idCliente) || idCliente <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID del cliente no es válido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT 
                ID_CLIENTE AS "id_cliente",
                NIT AS "nit",
                NOMBRE_COMPLETO AS "nombre_completo",
                CORREO AS "correo",
                DIRECCION_ENVIO AS "direccion_envio"
            FROM ADMIN.CLIENTE
            WHERE ID_CLIENTE = :idCliente
        `, { idCliente });

        if (result.rows.length === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Cliente no encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 3. POST /api/cliente -> CREAR/REGISTRAR UN CLIENTE
// ========================================================
router.post('/api/cliente', async (req, res, next) => {
    let connection;
    const { nit, nombre_completo, correo, direccion_envio } = req.body;

    // --- REGLA 16: VALIDACIÓN DE INFORMACIÓN MÍNIMA ---
    if (!nombre_completo || typeof nombre_completo !== 'string' || nombre_completo.trim() === '') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El nombre completo del cliente es mandatorio.' });
    }
    if (!correo || typeof correo !== 'string' || !correo.includes('@')) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Debe proveer un correo electrónico válido.' });
    }

    // --- REGLA 4: TRATAMIENTO FISCAL DEL NIT EN GUATEMALA ---
    // Si no se envía el NIT, o viene vacío, se le asigna 'CF' por defecto según la estructura
    let nitFinal = 'CF';
    if (nit && typeof nit === 'string' && nit.trim() !== '') {
        nitFinal = nit.trim().toUpperCase();
    }

    try {
        connection = await database.getPool().getConnection();

        // Omitimos ID_CLIENTE ya que Oracle usa su secuencia nativa identity
        const sql = `
            INSERT INTO CLIENTE (
                NIT,
                NOMBRE_COMPLETO,
                CORREO,
                DIRECCION_ENVIO
            ) VALUES (
                :nit,
                :nombre_completo,
                :correo,
                :direccion_envio
            ) RETURNING ID_CLIENTE INTO :out_id
        `;

        const bindParams = {
            nit: nitFinal,
            nombre_completo: nombre_completo.trim(),
            correo: correo.trim().toLowerCase(),
            direccion_envio: direccion_envio ? direccion_envio.trim() : null,
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT }
        };

        const result = await connection.execute(sql, bindParams, { autoCommit: true });

        res.status(201).json({
            estado: 'OK',
            mensaje: 'Cliente registrado exitosamente cumpliendo normativas de la SAT.',
            data: {
                id_cliente: result.outBinds.out_id[0],
                nit: nitFinal
            }
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 4. PUT /api/cliente/:id -> ACTUALIZACIÓN INTEGRAL
// ========================================================
router.put('/api/cliente/:id', async (req, res, next) => {
    let connection;
    const idCliente = Number(req.params.id);
    const { nit, nombre_completo, correo, direccion_envio } = req.body;

    if (!Number.isInteger(idCliente) || idCliente <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID del cliente no es válido.' });
    }

    if (!nombre_completo || !correo) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El nombre completo y correo son obligatorios para actualizar.' });
    }

    let nitFinal = 'CF';
    if (nit && typeof nit === 'string' && nit.trim() !== '') {
        nitFinal = nit.trim().toUpperCase();
    }

    try {
        connection = await database.getPool().getConnection();

        const sql = `
            UPDATE CLIENTE
            SET 
                NIT = :nit,
                NOMBRE_COMPLETO = :nombre_completo,
                CORREO = :correo,
                DIRECCION_ENVIO = :direccion_envio
            WHERE ID_CLIENTE = :idCliente
        `;

        const result = await connection.execute(sql, {
            nit: nitFinal,
            nombre_completo: nombre_completo.trim(),
            correo: correo.trim().toLowerCase(),
            direccion_envio: direccion_envio ? direccion_envio.trim() : null,
            idCliente
        }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'El cliente que intenta modificar no existe.' });
        }

        res.json({
            estado: 'OK',
            mensaje: `Los datos del cliente con ID ${idCliente} fueron actualizados de forma correcta.`
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
