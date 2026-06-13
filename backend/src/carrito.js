const express = require('express');
const router = express.Router();
const database = require('./config/db');

// ========================================================
// 1. GET /api/carrito -> LISTAR HISTORIAL DE ÓRDENES
// ========================================================
router.get('/api/carrito', async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        
        const result = await connection.execute(`
            SELECT 
                ID_ORDEN AS "id_orden",
                ID_CLIENTE AS "id_cliente",
                FECHA_ORDEN AS "fecha_orden",
                SUBTOTAL AS "subtotal",
                MONTO_IVA AS "monto_iva",
                TOTAL_CON_IVA AS "total_con_iva",
                CUOTAS_VISACUOTAS AS "cuotas_visacuotas",
                ESTADO AS "estado"
            FROM ADMIN.ORDEN_COMPRA
            ORDER BY FECHA_ORDEN DESC
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 2. GET /api/carrito/:id -> OBTENER UNA ÓRDEN POR ID
// ========================================================
router.get('/api/carrito/:id', async (req, res, next) => {
    let connection;
    const idOrden = Number(req.params.id);

    if (!Number.isInteger(idOrden) || idOrden <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID de la orden no es válido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT 
                ID_ORDEN AS "id_orden",
                ID_CLIENTE AS "id_cliente",
                FECHA_ORDEN AS "fecha_orden",
                SUBTOTAL AS "subtotal",
                MONTO_IVA AS "monto_iva",
                TOTAL_CON_IVA AS "total_con_iva",
                CUOTAS_VISACUOTAS AS "cuotas_visacuotas",
                ESTADO AS "estado"
            FROM ADMIN.ORDEN_COMPRA
            WHERE ID_ORDEN = :idOrden
        `, { idOrden });

        if (result.rows.length === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Orden de compra no encontrada.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 3. POST /api/carrito/crear -> GENERAR ENCABEZADO DE ORDEN
// ========================================================
router.post('/api/carrito/crear', async (req, res, next) => {
    let connection;
    const { id_cliente, subtotal, monto_iva, total_con_iva, cuotas_visacuotas } = req.body;

    // --- REGLA 16: CONTROL DE DATOS MÍNIMOS DEL CLIENTE ---
    if (!id_cliente || typeof id_cliente !== 'number') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 16: No se puede generar una orden sin asociar un cliente válido.' });
    }

    // --- REGLA 16: PROHIBIR VALORES NEGATIVOS O EN CERO ---
    if (subtotal === undefined || subtotal <= 0 || total_con_iva === undefined || total_con_iva <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 16: El subtotal y total de la orden deben ser superiores a Q0.00.' });
    }

    // --- REGLAS 1 Y 14: VERIFICACIÓN FISCAL DEL 12% (QUETZALES) ---
    const ivaCalculado = Number((subtotal * 0.12).toFixed(2));
    const totalCalculado = Number((subtotal + ivaCalculado).toFixed(2));

    // Tolerancia decimal de un centavo por temas de redondeo en JavaScript
    if (Math.abs(monto_iva - ivaCalculado) > 0.02 || Math.abs(total_con_iva - totalCalculado) > 0.02) {
        return res.status(400).json({ 
            estado: 'ERROR', 
            mensaje: `Regla 1: Inconsistencia fiscal detectada. Para un subtotal de Q${subtotal}, el IVA debe ser Q${ivaCalculado} y el Total Q${totalCalculado}.` 
        });
    }

    try {
        connection = await database.getPool().getConnection();

        // Dejamos que ID_ORDEN, FECHA_ORDEN y ESTADO se llenen de forma automática con sus DEFAULTS nativos (nextval, SYSTIMESTAMP, 'PENDIENTE')
        const sql = `
            INSERT INTO ORDEN_COMPRA (
                ID_CLIENTE,
                SUBTOTAL,
                MONTO_IVA,
                TOTAL_CON_IVA,
                CUOTAS_VISACUOTAS
            ) VALUES (
                :id_cliente,
                :subtotal,
                :monto_iva,
                :total_con_iva,
                :cuotas_visacuotas
            ) RETURNING ID_ORDEN, ESTADO, FECHA_ORDEN INTO :out_id, :out_estado, :out_fecha
        `;

        const bindParams = {
            id_cliente,
            subtotal,
            monto_iva,
            total_con_iva,
            cuotas_visacuotas: cuotas_visacuotas || 1, // Por defecto 1 cuota si viene vacío
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT },
            out_estado: { type: database.getOracleDriver().STRING, dir: database.getOracleDriver().BIND_OUT, maxSize: 20 },
            out_fecha: { type: database.getOracleDriver().TIMESTAMP, dir: database.getOracleDriver().BIND_OUT }
        };

        const result = await connection.execute(sql, bindParams, { autoCommit: true });

        res.status(201).json({
            estado: 'OK',
            mensaje: 'Encabezado de orden validado y creado exitosamente.',
            data: {
                id_orden: result.outBinds.out_id[0],
                estado: result.outBinds.out_estado[0],
                fecha_orden: result.outBinds.out_fecha[0]
            }
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 4. PUT /api/carrito/:id -> ACTUALIZACIÓN DE ESTADO (AUDITORÍA)
// ========================================================
router.post('/api/carrito/confirmar', async (req, res, next) => {
    let connection;
    const { id_cliente, subtotal, monto_iva, total_con_iva, cuotas_visacuotas, productos } = req.body;

    if (!id_cliente || typeof id_cliente !== 'number') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 16: No se puede generar una orden sin asociar un cliente valido.' });
    }

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 16: No se puede generar una orden vacia sin articulos.' });
    }

    if (subtotal === undefined || subtotal <= 0 || total_con_iva === undefined || total_con_iva <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 16: El subtotal y total de la orden deben ser superiores a Q0.00.' });
    }

    const ivaCalculado = Number((subtotal * 0.12).toFixed(2));
    const totalCalculado = Number((subtotal + ivaCalculado).toFixed(2));

    if (Math.abs(monto_iva - ivaCalculado) > 0.02 || Math.abs(total_con_iva - totalCalculado) > 0.02) {
        return res.status(400).json({
            estado: 'ERROR',
            mensaje: `Regla 1: Inconsistencia fiscal detectada. Para un subtotal de Q${subtotal}, el IVA debe ser Q${ivaCalculado} y el Total Q${totalCalculado}.`
        });
    }

    try {
        connection = await database.getPool().getConnection();

        const orderResult = await connection.execute(`
            INSERT INTO ADMIN.ORDEN_COMPRA (
                ID_CLIENTE,
                SUBTOTAL,
                MONTO_IVA,
                TOTAL_CON_IVA,
                CUOTAS_VISACUOTAS
            ) VALUES (
                :id_cliente,
                :subtotal,
                :monto_iva,
                :total_con_iva,
                :cuotas_visacuotas
            ) RETURNING ID_ORDEN, ESTADO, FECHA_ORDEN INTO :out_id, :out_estado, :out_fecha
        `, {
            id_cliente,
            subtotal,
            monto_iva,
            total_con_iva,
            cuotas_visacuotas: cuotas_visacuotas || 1,
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT },
            out_estado: { type: database.getOracleDriver().STRING, dir: database.getOracleDriver().BIND_OUT, maxSize: 20 },
            out_fecha: { type: database.getOracleDriver().TIMESTAMP, dir: database.getOracleDriver().BIND_OUT }
        });

        const idOrden = orderResult.outBinds.out_id[0];

        for (const item of productos) {
            const { id_producto, cantidad, precio_unitario } = item;

            if (!id_producto || !cantidad || cantidad <= 0 || !precio_unitario || precio_unitario <= 0) {
                throw new Error('Estructura de item inconsistente. Verifique ID, cantidad y precios.');
            }

            const stockResult = await connection.execute(`
                SELECT STOCK_ACTUAL AS "stock_actual", NOMBRE AS "nombre"
                FROM ADMIN.PRODUCTO
                WHERE ID_PRODUCTO = :id_producto
                FOR UPDATE
            `, { id_producto });

            if (stockResult.rows.length === 0) {
                throw new Error(`El articulo con ID ${id_producto} no figura en el catalogo de Oracle.`);
            }

            const stockActual = stockResult.rows[0].stock_actual || 0;
            const nombreProducto = stockResult.rows[0].nombre;

            if (stockActual === 0) {
                throw new Error(`Regla 5: El producto "${nombreProducto}" se encuentra AGOTADO.`);
            }

            if (cantidad > stockActual) {
                throw new Error(`Regla 5: Stock insuficiente para "${nombreProducto}". Solicitado: ${cantidad}, Disponible: ${stockActual}.`);
            }

            const subtotalLinea = Number((cantidad * precio_unitario).toFixed(2));

            await connection.execute(`
                INSERT INTO ADMIN.DETALLE_ORDEN (
                    ID_ORDEN,
                    ID_PRODUCTO,
                    CANTIDAD,
                    PRECIO_UNITARIO,
                    SUBTOTAL_LINEA
                ) VALUES (
                    :idOrden,
                    :id_producto,
                    :cantidad,
                    :precio_unitario,
                    :subtotalLinea
                )
            `, { idOrden, id_producto, cantidad, precio_unitario, subtotalLinea });

            await connection.execute(`
                UPDATE ADMIN.PRODUCTO
                SET STOCK_ACTUAL = STOCK_ACTUAL - :cantidad
                WHERE ID_PRODUCTO = :id_producto
            `, { cantidad, id_producto });
        }

        await connection.commit();

        res.status(201).json({
            estado: 'OK',
            mensaje: 'Orden creada exitosamente con detalle e inventario actualizado.',
            data: {
                id_orden: idOrden,
                estado: orderResult.outBinds.out_estado[0],
                fecha_orden: orderResult.outBinds.out_fecha[0]
            }
        });
    } catch (err) {
        if (connection) {
            console.error('[Rollback Carrito] Revirtiendo orden por error:', err.message);
            await connection.rollback();
        }
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.put('/api/carrito/:id', async (req, res, next) => {
    let connection;
    const idOrden = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(idOrden) || idOrden <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID de la orden no es válido.' });
    }

    if (!estado || typeof estado !== 'string' || estado.trim() === '') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Debe ingresar un estado válido (ej. PAGADO, CANCELADO).' });
    }

    const estadoSanitizado = estado.trim().toUpperCase();

    try {
        connection = await database.getPool().getConnection();

        // REGLA 17 y 18: Trazabilidad transaccional
        const sql = `
            UPDATE ORDEN_COMPRA
            SET ESTADO = :estadoSanitizado
            WHERE ID_ORDEN = :idOrden
        `;

        const result = await connection.execute(sql, { estadoSanitizado, idOrden }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'La orden solicitada no existe.' });
        }

        res.json({
            estado: 'OK',
            mensaje: `El estado de la orden ${idOrden} cambió exitosamente a: ${estadoSanitizado}.`
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
