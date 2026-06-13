const express = require('express');
const router = express.Router();
const database = require('./config/db');

// ========================================================
// 1. GET /api/producto -> LISTAR TODO EL CATÁLOGO
// ========================================================
router.get('/api/producto', async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();

        // REGLA 7, 10 y 12: Filtrar productos válidos (SKU, Nombre y Categoría presentes)
        // Traemos las columnas calculadas IVA_MONTO y PRECIO_TOTAL autogestionadas por Oracle
        const result = await connection.execute(`
            SELECT 
                ID_PRODUCTO AS "id_producto",
                p.ID_CATEGORIA AS "id_categoria",
                p.CODIGO_SKU AS "codigo_sku",
                p.NOMBRE AS "nombre",
                p.PRECIO_UNITARIO AS "precio_unitario",
                p.STOCK_ACTUAL AS "stock_actual",
                p.FICHA_TECNICA AS "ficha_tecnica",
                p.URL_GALERIA AS "url_galeria",
                p.IVA_MONTO AS "iva_monto",
                p.PRECIO_TOTAL AS "precio_total",
                p.STOCK_RESERVADO AS "stock_reservado",
                c.NOMBRE AS "categoria"
            FROM ADMIN.PRODUCTO p
            LEFT JOIN ADMIN.CATEGORIA c ON c.ID_CATEGORIA = p.ID_CATEGORIA
            WHERE p.CODIGO_SKU IS NOT NULL 
              AND p.NOMBRE IS NOT NULL
              AND p.PRECIO_UNITARIO > 0
            ORDER BY p.NOMBRE ASC
        `);

        // REGLA 14: Los montos van formateados con la semántica de Quetzales (Q)
        const productosProcesados = result.rows.map(prod => {
            // REGLA 11: Si la ficha técnica es nula, se muestra como "No especificado"
            if (!prod.ficha_tecnica || prod.ficha_tecnica.toString().trim() === '') {
                prod.ficha_tecnica = "No especificado";
            }
            return prod;
        });

        res.json(productosProcesados);
    } catch (err) {
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// ========================================================
// 2. GET /api/producto/:id -> OBTENER DETALLE POR ID
// ========================================================
router.get('/api/producto/:id', async (req, res, next) => {
    let connection;
    const idProducto = Number(req.params.id);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID del producto no es válido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT 
                ID_PRODUCTO AS "id_producto",
                p.ID_CATEGORIA AS "id_categoria",
                p.CODIGO_SKU AS "codigo_sku",
                p.NOMBRE AS "nombre",
                p.PRECIO_UNITARIO AS "precio_unitario",
                p.STOCK_ACTUAL AS "stock_actual",
                p.FICHA_TECNICA AS "ficha_tecnica",
                p.URL_GALERIA AS "url_galeria",
                p.IVA_MONTO AS "iva_monto",
                p.PRECIO_TOTAL AS "precio_total",
                p.STOCK_RESERVADO AS "stock_reservado",
                c.NOMBRE AS "categoria"
            FROM ADMIN.PRODUCTO p
            LEFT JOIN ADMIN.CATEGORIA c ON c.ID_CATEGORIA = p.ID_CATEGORIA
            WHERE p.ID_PRODUCTO = :idProducto
        `, { idProducto });

        if (result.rows.length === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Producto no encontrado.' });
        }

        const producto = result.rows[0];

        // REGLA 8: Validación de seguridad preventiva sobre el precio recuperado
        if (!producto.precio_unitario || producto.precio_unitario <= 0) {
            return res.status(422).json({ estado: 'ERROR', mensaje: 'Regla 8: El producto no cuenta con un precio de venta válido.' });
        }

        // REGLA 11: Tratamiento de ficha técnica ausente
        if (!producto.ficha_tecnica || producto.ficha_tecnica.toString().trim() === '') {
            producto.ficha_tecnica = "No especificado";
        }

        res.json(producto);
    } catch (err) {
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// ========================================================
// 3. POST /api/producto -> CREAR UN NUEVO REGISTRO
// ========================================================
router.post('/api/producto', async (req, res, next) => {
    let connection;
    const { id_categoria, codigo_sku, nombre, precio_unitario, stock_actual, ficha_tecnica, url_galeria } = req.body;

    // --- REGLA 10: VALIDACIÓN DE INFORMACIÓN MÍNIMA OBLIGATORIA ---
    if (!codigo_sku || typeof codigo_sku !== 'string' || codigo_sku.trim() === '') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 10: El código SKU único es obligatorio.' });
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 10: El nombre comercial del producto es obligatorio.' });
    }
    if (!id_categoria || typeof id_categoria !== 'number') {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 10: La categoría del producto es requerida.' });
    }

    // --- REGLA 8: PRECIO VÁLIDO MAYOR A CERO ---
    if (precio_unitario === undefined || typeof precio_unitario !== 'number' || precio_unitario <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 8: El precio unitario debe ser una cantidad numérica mayor a cero.' });
    }

    // --- REGLA 5: VALIDACIÓN DE STOCK INICIAL ---
    if (stock_actual !== undefined && (typeof stock_actual !== 'number' || stock_actual < 0)) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El stock inicial de operaciones no puede ser negativo.' });
    }

    try {
        connection = await database.getPool().getConnection();

        // Estructura SQL limpia omitiendo columnas virtuales (Regla 1 - Oracle automatiza el cálculo de IVA)
        const sql = `
            INSERT INTO PRODUCTO (
                ID_CATEGORIA,
                CODIGO_SKU,
                NOMBRE,
                PRECIO_UNITARIO,
                STOCK_ACTUAL,
                FICHA_TECNICA,
                URL_GALERIA
            ) VALUES (
                :id_categoria,
                :codigo_sku,
                :nombre,
                :precio_unitario,
                :stock_actual,
                :ficha_tecnica,
                :url_galeria
            ) RETURNING ID_PRODUCTO, IVA_MONTO, PRECIO_TOTAL INTO :out_id, :out_iva, :out_total
        `;

        const bindParams = {
            id_categoria,
            codigo_sku: codigo_sku.trim(),
            nombre: nombre.trim(),
            precio_unitario,
            stock_actual: stock_actual || 0, // Default 0 si no se envía
            ficha_tecnica: ficha_tecnica || null,
            url_galeria: url_galeria || null, // Regla 10: El Front colocará un placeholder si es nulo
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT },
            out_iva: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT },
            out_total: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT }
        };

        const result = await connection.execute(sql, bindParams, { autoCommit: true });

        res.status(201).json({
            estado: 'OK',
            mensaje: 'Producto registrado exitosamente cumpliendo normativas fiscales.',
            data: {
                id_producto: result.outBinds.out_id[0],
                iva_calculado_12: result.outBinds.out_iva[0],
                precio_final_quetzales: result.outBinds.out_total[0]
            }
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// ========================================================
// 4. PUT /api/producto/:id -> ACTUALIZACIÓN INTEGRAL
// ========================================================
router.put('/api/producto/:id', async (req, res, next) => {
    let connection;
    const idProducto = Number(req.params.id);
    const { id_categoria, codigo_sku, nombre, precio_unitario, ficha_tecnica, url_galeria } = req.body;

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID del producto no es válido.' });
    }

    // Validaciones de contenido mínimo de actualización (Regla 8 y 10)
    if (!codigo_sku || !nombre || precio_unitario === undefined || !id_categoria) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Los parámetros SKU, categoría, nombre y precio son requeridos para actualizar.' });
    }
    if (precio_unitario <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Regla 8: El precio de actualización debe ser mayor a cero.' });
    }

    try {
        connection = await database.getPool().getConnection();

        const sql = `
            UPDATE PRODUCTO
            SET 
                ID_CATEGORIA = :id_categoria,
                CODIGO_SKU = :codigo_sku,
                NOMBRE = :nombre,
                PRECIO_UNITARIO = :precio_unitario,
                FICHA_TECNICA = :ficha_tecnica,
                URL_GALERIA = :url_galeria
            WHERE ID_PRODUCTO = :idProducto
        `;

        const result = await connection.execute(sql, {
            id_categoria,
            codigo_sku: codigo_sku.trim(),
            nombre: nombre.trim(),
            precio_unitario,
            ficha_tecnica: ficha_tecnica || null,
            url_galeria: url_galeria || null,
            idProducto
        }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'El producto solicitado para modificar no existe.' });
        }

        res.json({
            estado: 'OK',
            mensaje: `El producto ${idProducto} ha sido modificado y su IVA recalculado de forma nativa.`
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

// ========================================================
// 5. PATCH /api/producto/:id/stock -> SINCRONIZAR INVENTARIO
// ========================================================
router.patch('/api/producto/:id/stock', async (req, res, next) => {
    let connection;
    const idProducto = Number(req.params.id);
    const { nuevo_stock } = req.body;

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'El ID del producto no es válido.' });
    }
    if (nuevo_stock === undefined || typeof nuevo_stock !== 'number' || nuevo_stock < 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Debe ingresar un valor de stock numérico mayor o igual a cero.' });
    }

    try {
        connection = await database.getPool().getConnection();

        // REGLA 17: Trazabilidad y actualización atómica del inventario
        const result = await connection.execute(`
            UPDATE PRODUCTO
            SET STOCK_ACTUAL = :nuevo_stock
            WHERE ID_PRODUCTO = :idProducto
        `, { nuevo_stock, idProducto }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Producto no encontrado.' });
        }

        res.json({
            estado: 'OK',
            mensaje: `Inventario del producto ${idProducto} actualizado correctamente a ${nuevo_stock} unidades.`
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
});

module.exports = router;
