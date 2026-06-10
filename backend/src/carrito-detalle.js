const express = require('express');
const router = express.Router();
const database = require('./config/db');

// ========================================================
// 1. GET /api/carrito-detalle/orden/:id_orden -> LEER DETALLE
// ========================================================
router.get('/api/carrito-detalle/orden/:id_orden', async (req, res, next) => {
    let connection;
    const idOrden = Number(req.params.id_orden);

    if (!Number.isInteger(idOrden) || idOrden <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID de la orden no es válido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        
        // Hacemos un JOIN con la tabla PRODUCTO para devolver también el nombre comercial
        const result = await connection.execute(`
            SELECT 
                d.ID_DETALLE AS "id_detalle",
                d.ID_ORDEN AS "id_orden",
                d.ID_PRODUCTO AS "id_producto",
                p.NOMBRE AS "nombre_producto",
                d.CANTIDAD AS "cantidad",
                d.PRECIO_UNITARIO AS "precio_unitario",
                d.SUBTOTAL AS "subtotal"
            FROM ADMIN.DETALLE_ORDEN d
            LEFT JOIN ADMIN.PRODUCTO p ON d.ID_PRODUCTO = p.ID_PRODUCTO
            WHERE d.ID_ORDEN = :idOrden
            ORDER BY d.ID_DETALLE ASC
        `, { idOrden });

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

// ========================================================
// 2. POST /api/carrito-detalle/agregar -> PROCESAR CARRITO Y STOCK
// ========================================================
router.post('/api/carrito-detalle/agregar', async (req, res, next) => {
    let connection;
    const { id_orden, productos } = req.body;

    // --- REGLA 16: CRITERIO DE ACEPTACIÓN DE ORDEN NO VACÍA ---
    if (!id_orden || typeof id_orden !== 'number') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID de la orden vinculante es obligatorio.' });
    }
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 16: No se puede generar una orden vacía sin artículos.' });
    }

    try {
        connection = await database.getPool().getConnection();

        // Iniciamos el bucle analítico de transacciones de stock
        for (const item of productos) {
            const { id_producto, cantidad, precio_unitario } = item;

            // Validaciones de integridad básicas de entrada
            if (!id_producto || !cantidad || cantidad <= 0 || !precio_unitario || precio_unitario <= 0) {
                return res.status(400).json({ 
                    estado: 'ERROR', 
                    mensaje: 'Estructura de ítem inconsistente. Verifique ID, cantidad y precios.' 
                });
            }

            // [VERIFICACIÓN EN CALIENTE - REGLA 5 Y 16]
            // Bloqueamos la fila del producto temporalmente para mitigar la compra simultánea del mismo artículo
            const checkStockSql = `
                SELECT STOCK_ACTUAL, NOMBRE 
                FROM ADMIN.PRODUCTO 
                WHERE ID_PRODUCTO = :id_producto 
                FOR UPDATE
            `;
            
            const stockResult = await connection.execute(checkStockSql, { id_producto });

            if (stockResult.rows.length === 0) {
                throw new Error(`El artículo con ID ${id_producto} no figura en el catálogo de Oracle.`);
            }

            const stockActual = stockResult.rows[0][0] || 0;
            const nombreProducto = stockResult.rows[0][1];

            // --- REGLA 5: PROHIBIR PRODUCTOS CON EXISTENCIAS EN CERO ---
            if (stockActual === 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    estado: 'ERROR', 
                    mensaje: `Regla 5: El producto "${nombreProducto}" se encuentra AGOTADO.` 
                });
            }

            // --- REGLA 5: EVALUACIÓN DE EXCESO DE DEMANDA SOBRE STOCK DISPONIBLE ---
            if (cantidad > stockActual) {
                await connection.rollback();
                return res.status(400).json({ 
                    estado: 'ERROR', 
                    mensaje: `Regla 5: Stock insuficiente para "${nombreProducto}". Solicitado: ${cantidad}, Disponible: ${stockActual}.` 
                });
            }

            // --- CÁLCULO SEGURO DEL SUBTOTAL EN QUETZALES (Q) ---
            const subtotalCalculado = Number((cantidad * precio_unitario).toFixed(2));

            // ACCIÓN A: Insertar el registro correspondiente en la tabla DETALLE_ORDEN
            const insertDetalleSql = `
                INSERT INTO DETALLE_ORDEN (
                    ID_ORDEN,
                    ID_PRODUCTO,
                    CANTIDAD,
                    PRECIO_UNITARIO,
                    SUBTOTAL
                ) VALUES (
                    :id_orden,
                    :id_producto,
                    :cantidad,
                    :precio_unitario,
                    :subtotalCalculado
                )
            `;
            await connection.execute(insertDetalleSql, {
                id_orden, id_producto, cantidad, precio_unitario, subtotalCalculado
            });

            // ACCIÓN B: Devaluación física del stock en la tabla PRODUCTO (Regla 6 y 17)
            const descStockSql = `
                UPDATE ADMIN.PRODUCTO 
                SET STOCK_ACTUAL = STOCK_ACTUAL - :cantidad 
                WHERE ID_PRODUCTO = :id_producto
            `;
            await connection.execute(descStockSql, { cantidad, id_producto });
        }

        // --- REGLA 17: CONSOLIDACIÓN INTEGRAL DE LA TRANSACCIÓN (ACID) ---
        // Si todo el carrito superó con éxito los filtros, confirmamos los cambios en Oracle
        await connection.commit();

        res.status(201).json({
            estado: 'OK',
            mensaje: `Reglas de negocio validadas. ${productos.length} productos agregados al detalle de la orden ${id_orden} con devaluación de inventario exitosa.`
        });

    } catch (err) {
        // --- REGLA 17 y 18: SEGURIDAD Y REVERSIÓN ANTE FALLOS ---
        if (connection) {
            console.error('[Rollback Detalle] Revirtiendo cambios por error crítico:', err.message);
            await connection.rollback();
        }
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;