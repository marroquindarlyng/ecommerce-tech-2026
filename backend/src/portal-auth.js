const crypto = require('crypto');
const express = require('express');
const database = require('./config/db');

const router = express.Router();
const ROLES_STAFF = ['admin', 'vendedor'];

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
    const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex');
    return { salt, hash };
};

const verifyPassword = (password, user) => {
    const credentials = hashPassword(password, user.password_salt);
    return credentials.hash === user.password_hash;
};

const publicUser = (user) => ({
    id: user.id_usuario,
    id_cliente: user.id_cliente || null,
    nombre: user.nombre,
    correo: user.correo,
    nit: user.nit || 'CF',
    telefono: user.telefono || '',
    direccion_envio: user.direccion_envio || '',
    rol: user.rol,
    estado: user.estado,
    created_at: user.created_at,
    validated_at: user.validated_at || null
});

const getRequestRole = (req) => String(req.header('x-user-role') || '').toLowerCase();
const getRequestUserId = (req) => Number(req.header('x-user-id') || 0);

const requireAdmin = (req, res, next) => {
    if (getRequestRole(req) !== 'admin') {
        return res.status(403).json({ estado: 'ERROR', mensaje: 'Acceso reservado para administradores.' });
    }

    next();
};

const requireStaff = (req, res, next) => {
    if (!ROLES_STAFF.includes(getRequestRole(req))) {
        return res.status(403).json({ estado: 'ERROR', mensaje: 'Acceso reservado para equipo de tienda.' });
    }

    next();
};

const createClientForUser = async (connection, user) => {
    if (user.id_cliente) return user.id_cliente;

    const correo = String(user.correo || '').trim().toLowerCase();
    const nit = String(user.nit || 'CF').trim().toUpperCase() || 'CF';
    const direccionEnvio = user.direccion_envio || null;

    const existing = await connection.execute(`
        SELECT
            ID_CLIENTE AS "id_cliente",
            NOMBRE_COMPLETO AS "nombre_completo",
            CORREO AS "correo",
            NIT AS "nit",
            DIRECCION_ENVIO AS "direccion_envio"
        FROM ADMIN.CLIENTE
        WHERE LOWER(CORREO) = :correo
           OR (:nit <> 'CF' AND NIT = :nit)
        ORDER BY CASE WHEN LOWER(CORREO) = :correo THEN 0 ELSE 1 END,
                 ID_CLIENTE ASC
    `, { correo, nit });

    if (existing.rows[0]) {
        const idCliente = existing.rows[0].id_cliente;
        await connection.execute(`
            UPDATE ADMIN.CLIENTE
            SET
                NOMBRE_COMPLETO = COALESCE(:nombre_completo, NOMBRE_COMPLETO),
                NIT = CASE WHEN NIT = 'CF' AND :nit <> 'CF' THEN :nit ELSE NIT END,
                DIRECCION_ENVIO = COALESCE(:direccion_envio, DIRECCION_ENVIO)
            WHERE ID_CLIENTE = :idCliente
        `, {
            nombre_completo: user.nombre,
            nit,
            direccion_envio: direccionEnvio,
            idCliente
        });

        return idCliente;
    }

    try {
        const result = await connection.execute(`
            INSERT INTO ADMIN.CLIENTE (
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
        `, {
            nit,
            nombre_completo: user.nombre,
            correo,
            direccion_envio: direccionEnvio,
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT }
        });

        return result.outBinds.out_id[0];
    } catch (err) {
        if (err.errorNum !== 1) throw err;

        const duplicated = await connection.execute(`
            SELECT ID_CLIENTE AS "id_cliente"
            FROM ADMIN.CLIENTE
            WHERE LOWER(CORREO) = :correo
               OR NIT = :nit
            ORDER BY CASE WHEN LOWER(CORREO) = :correo THEN 0 ELSE 1 END,
                     ID_CLIENTE ASC
        `, { correo, nit });

        if (duplicated.rows[0]) return duplicated.rows[0].id_cliente;
        throw err;
    }
};

const validateProductPayload = (payload) => {
    const product = {
        id_categoria: Number(payload.id_categoria),
        codigo_sku: String(payload.codigo_sku || '').trim().toUpperCase(),
        nombre: String(payload.nombre || '').trim(),
        precio_unitario: Number(payload.precio_unitario),
        stock_actual: Number(payload.stock_actual || 0),
        ficha_tecnica: payload.ficha_tecnica ? String(payload.ficha_tecnica).trim() : null,
        url_galeria: payload.url_galeria ? String(payload.url_galeria).trim() : null
    };

    if (!Number.isInteger(product.id_categoria) || product.id_categoria <= 0) {
        return { error: 'Selecciona una categoria valida.' };
    }

    if (!product.codigo_sku || !product.nombre) {
        return { error: 'SKU y nombre del producto son obligatorios.' };
    }

    if (!Number.isFinite(product.precio_unitario) || product.precio_unitario <= 0) {
        return { error: 'El precio debe ser mayor a cero.' };
    }

    if (!Number.isFinite(product.stock_actual) || product.stock_actual < 0) {
        return { error: 'El stock no puede ser negativo.' };
    }

    return { product };
};

const insertProduct = async (connection, product) => {
    const result = await connection.execute(`
        INSERT INTO ADMIN.PRODUCTO (
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
        ) RETURNING ID_PRODUCTO INTO :out_id
    `, {
        id_categoria: product.id_categoria,
        codigo_sku: product.codigo_sku,
        nombre: product.nombre,
        precio_unitario: product.precio_unitario,
        stock_actual: product.stock_actual,
        ficha_tecnica: product.ficha_tecnica || null,
        url_galeria: product.url_galeria || null,
        out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT }
    });

    return result.outBinds.out_id[0];
};

const selectProductsSql = `
    SELECT
        p.ID_PRODUCTO AS "id_producto",
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
`;

router.post('/api/auth/register', async (req, res, next) => {
    let connection;
    const { nombre, correo, password, nit, telefono, direccion_envio } = req.body;

    if (!nombre || String(nombre).trim().length < 3) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Ingresa tu nombre completo.' });
    }

    if (!correo || !String(correo).includes('@')) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Ingresa un correo valido.' });
    }

    if (!password || String(password).length < 6) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'La contrasena debe tener al menos 6 caracteres.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const normalizedEmail = String(correo).trim().toLowerCase();
        const credentials = hashPassword(password);

        const result = await connection.execute(`
            INSERT INTO ADMIN.USUARIO_PORTAL (
                NOMBRE,
                CORREO,
                PASSWORD_HASH,
                PASSWORD_SALT,
                ROL,
                ESTADO,
                NIT,
                TELEFONO,
                DIRECCION_ENVIO
            ) VALUES (
                :nombre,
                :correo,
                :password_hash,
                :password_salt,
                'cliente',
                'PENDIENTE',
                :nit,
                :telefono,
                :direccion_envio
            ) RETURNING ID_USUARIO INTO :out_id
        `, {
            nombre: String(nombre).trim(),
            correo: normalizedEmail,
            password_hash: credentials.hash,
            password_salt: credentials.salt,
            nit: nit ? String(nit).trim().toUpperCase() : 'CF',
            telefono: telefono ? String(telefono).trim() : null,
            direccion_envio: direccion_envio ? String(direccion_envio).trim() : null,
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT }
        }, { autoCommit: true });

        res.status(201).json({
            estado: 'OK',
            mensaje: 'Solicitud recibida. Un administrador debe aprobarla para activar la cuenta.',
            data: { id: result.outBinds.out_id[0] }
        });
    } catch (err) {
        if (err.errorNum === 1) {
            return res.status(409).json({ estado: 'ERROR', mensaje: 'Ya existe una solicitud o cuenta con ese correo.' });
        }
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.post('/api/auth/login', async (req, res, next) => {
    let connection;
    const { correo, password } = req.body;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                ID_USUARIO AS "id_usuario",
                ID_CLIENTE AS "id_cliente",
                NOMBRE AS "nombre",
                CORREO AS "correo",
                PASSWORD_HASH AS "password_hash",
                PASSWORD_SALT AS "password_salt",
                ROL AS "rol",
                ESTADO AS "estado",
                NIT AS "nit",
                TELEFONO AS "telefono",
                DIRECCION_ENVIO AS "direccion_envio",
                CREATED_AT AS "created_at",
                VALIDATED_AT AS "validated_at"
            FROM ADMIN.USUARIO_PORTAL
            WHERE CORREO = :correo
        `, { correo: String(correo || '').trim().toLowerCase() });

        const user = result.rows[0];

        if (!user || !verifyPassword(password || '', user)) {
            return res.status(401).json({ estado: 'ERROR', mensaje: 'Correo o contrasena incorrectos.' });
        }

        if (user.estado !== 'APROBADO') {
            return res.status(403).json({
                estado: 'ERROR',
                mensaje: user.estado === 'DENEGADO'
                    ? 'Tu solicitud fue denegada. Contacta a soporte para revisarla.'
                    : 'Tu cuenta aun esta pendiente de aprobacion.'
            });
        }

        res.json({ estado: 'OK', data: publicUser(user) });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/admin/solicitudes', requireAdmin, async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                ID_USUARIO AS "id_usuario",
                ID_CLIENTE AS "id_cliente",
                NOMBRE AS "nombre",
                CORREO AS "correo",
                ROL AS "rol",
                ESTADO AS "estado",
                NIT AS "nit",
                TELEFONO AS "telefono",
                DIRECCION_ENVIO AS "direccion_envio",
                CREATED_AT AS "created_at",
                VALIDATED_AT AS "validated_at"
            FROM ADMIN.USUARIO_PORTAL
            WHERE ROL = 'cliente'
            ORDER BY CREATED_AT DESC
        `);

        res.json(result.rows.map(publicUser));
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.patch('/api/admin/solicitudes/:id', requireAdmin, async (req, res, next) => {
    let connection;
    const id = Number(req.params.id);
    const action = String(req.body.action || '').toLowerCase();

    if (!Number.isInteger(id) || id <= 0 || !['aprobar', 'denegar'].includes(action)) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Solicitud invalida.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                ID_USUARIO AS "id_usuario",
                ID_CLIENTE AS "id_cliente",
                NOMBRE AS "nombre",
                CORREO AS "correo",
                ROL AS "rol",
                ESTADO AS "estado",
                NIT AS "nit",
                TELEFONO AS "telefono",
                DIRECCION_ENVIO AS "direccion_envio",
                CREATED_AT AS "created_at",
                VALIDATED_AT AS "validated_at"
            FROM ADMIN.USUARIO_PORTAL
            WHERE ID_USUARIO = :id
              AND ROL = 'cliente'
            FOR UPDATE
        `, { id });

        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Solicitud no encontrada.' });
        }

        let idCliente = user.id_cliente;
        const estado = action === 'aprobar' ? 'APROBADO' : 'DENEGADO';

        if (estado === 'APROBADO') {
            idCliente = await createClientForUser(connection, user);
        }

        await connection.execute(`
            UPDATE ADMIN.USUARIO_PORTAL
            SET ESTADO = :estado,
                ID_CLIENTE = :idCliente,
                VALIDATED_AT = SYSTIMESTAMP
            WHERE ID_USUARIO = :id
        `, { estado, idCliente, id });

        await connection.commit();
        res.json({ estado: 'OK', mensaje: estado === 'APROBADO' ? 'Cliente aprobado y vinculado.' : 'Solicitud denegada.' });
    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/admin/usuarios', requireAdmin, async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                ID_USUARIO AS "id_usuario",
                ID_CLIENTE AS "id_cliente",
                NOMBRE AS "nombre",
                CORREO AS "correo",
                ROL AS "rol",
                ESTADO AS "estado",
                NIT AS "nit",
                TELEFONO AS "telefono",
                DIRECCION_ENVIO AS "direccion_envio",
                CREATED_AT AS "created_at",
                VALIDATED_AT AS "validated_at"
            FROM ADMIN.USUARIO_PORTAL
            ORDER BY ROL, NOMBRE
        `);

        res.json(result.rows.map(publicUser));
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.post('/api/admin/usuarios', requireAdmin, async (req, res, next) => {
    let connection;
    const { nombre, correo, password, rol, nit, telefono } = req.body;
    const role = String(rol || '').toLowerCase();

    if (!['admin', 'vendedor'].includes(role)) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Solo se pueden crear usuarios administrativos o vendedores.' });
    }

    if (!nombre || String(nombre).trim().length < 3 || !correo || !String(correo).includes('@')) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Nombre y correo son obligatorios.' });
    }

    if (!password || String(password).length < 6) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'La contrasena debe tener al menos 6 caracteres.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const credentials = hashPassword(password);
        const result = await connection.execute(`
            INSERT INTO ADMIN.USUARIO_PORTAL (
                NOMBRE,
                CORREO,
                PASSWORD_HASH,
                PASSWORD_SALT,
                ROL,
                ESTADO,
                NIT,
                TELEFONO,
                VALIDATED_AT
            ) VALUES (
                :nombre,
                :correo,
                :password_hash,
                :password_salt,
                :rol,
                'APROBADO',
                :nit,
                :telefono,
                SYSTIMESTAMP
            ) RETURNING ID_USUARIO INTO :out_id
        `, {
            nombre: String(nombre).trim(),
            correo: String(correo).trim().toLowerCase(),
            password_hash: credentials.hash,
            password_salt: credentials.salt,
            rol: role,
            nit: nit ? String(nit).trim().toUpperCase() : 'CF',
            telefono: telefono ? String(telefono).trim() : null,
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT }
        }, { autoCommit: true });

        res.status(201).json({ estado: 'OK', mensaje: 'Usuario creado.', data: { id: result.outBinds.out_id[0] } });
    } catch (err) {
        if (err.errorNum === 1) {
            return res.status(409).json({ estado: 'ERROR', mensaje: 'Ya existe un usuario con ese correo.' });
        }
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.patch('/api/admin/usuarios/:id', requireAdmin, async (req, res, next) => {
    let connection;
    const id = Number(req.params.id);
    const role = req.body.rol ? String(req.body.rol).toLowerCase() : null;
    const status = req.body.estado ? String(req.body.estado).toUpperCase() : null;
    const nombre = req.body.nombre ? String(req.body.nombre).trim() : null;
    const correo = req.body.correo ? String(req.body.correo).trim().toLowerCase() : null;
    const nit = req.body.nit ? String(req.body.nit).trim().toUpperCase() : null;
    const telefono = req.body.telefono ? String(req.body.telefono).trim() : null;
    const direccionEnvio = req.body.direccion_envio ? String(req.body.direccion_envio).trim() : null;
    const password = req.body.password ? String(req.body.password) : null;

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Usuario invalido.' });
    }

    if (role && !['admin', 'vendedor'].includes(role)) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Solo se pueden administrar roles internos.' });
    }

    if (status && !['PENDIENTE', 'APROBADO', 'DENEGADO'].includes(status)) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Estado invalido para usuarios internos.' });
    }

    if (correo && !correo.includes('@')) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Correo invalido.' });
    }

    if (password && password.length < 6) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'La contrasena debe tener al menos 6 caracteres.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const credentials = password ? hashPassword(password) : { hash: null, salt: null };
        const current = await connection.execute(`
            SELECT ROL AS "rol"
            FROM ADMIN.USUARIO_PORTAL
            WHERE ID_USUARIO = :id
        `, { id });

        if (!current.rows[0]) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Usuario no encontrado.' });
        }

        if (current.rows[0].rol === 'cliente') {
            return res.status(403).json({ estado: 'ERROR', mensaje: 'Los usuarios cliente se gestionan desde solicitudes.' });
        }

        await connection.execute(`
            UPDATE ADMIN.USUARIO_PORTAL
            SET ROL = COALESCE(:role, ROL),
                ESTADO = COALESCE(:status, ESTADO),
                NOMBRE = COALESCE(:nombre, NOMBRE),
                CORREO = COALESCE(:correo, CORREO),
                NIT = COALESCE(:nit, NIT),
                TELEFONO = COALESCE(:telefono, TELEFONO),
                DIRECCION_ENVIO = COALESCE(:direccionEnvio, DIRECCION_ENVIO),
                PASSWORD_HASH = COALESCE(:passwordHash, PASSWORD_HASH),
                PASSWORD_SALT = COALESCE(:passwordSalt, PASSWORD_SALT),
                VALIDATED_AT = CASE WHEN :status IS NULL THEN VALIDATED_AT ELSE SYSTIMESTAMP END
            WHERE ID_USUARIO = :id
        `, {
            role,
            status,
            nombre,
            correo,
            nit,
            telefono,
            direccionEnvio,
            passwordHash: credentials.hash,
            passwordSalt: credentials.salt,
            id
        }, { autoCommit: true });

        res.json({ estado: 'OK', mensaje: 'Usuario actualizado.' });
    } catch (err) {
        if (err.errorNum === 1) {
            return res.status(409).json({ estado: 'ERROR', mensaje: 'Ya existe un usuario con ese correo.' });
        }
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.delete('/api/admin/usuarios/:id', requireAdmin, async (req, res, next) => {
    let connection;
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Usuario invalido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const current = await connection.execute(`
            SELECT ROL AS "rol"
            FROM ADMIN.USUARIO_PORTAL
            WHERE ID_USUARIO = :id
        `, { id });

        if (!current.rows[0]) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Usuario no encontrado.' });
        }

        if (current.rows[0].rol === 'cliente') {
            return res.status(403).json({ estado: 'ERROR', mensaje: 'Los clientes no se eliminan desde usuarios internos.' });
        }

        await connection.execute(`
            DELETE FROM ADMIN.USUARIO_PORTAL
            WHERE ID_USUARIO = :id
        `, { id }, { autoCommit: true });

        res.json({ estado: 'OK', mensaje: 'Usuario eliminado.' });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/admin/clientes', requireAdmin, async (req, res, next) => {
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
            ORDER BY ID_CLIENTE DESC
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/admin/kpis', requireAdmin, async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const orders = await connection.execute(`
            SELECT
                COUNT(*) AS "ordenes",
                NVL(SUM(TOTAL_CON_IVA), 0) AS "ventas",
                NVL(AVG(TOTAL_CON_IVA), 0) AS "ticket_promedio",
                SUM(CASE WHEN ESTADO IN ('PENDIENTE', 'PAGADO', 'PREPARANDO', 'ENVIADO') THEN 1 ELSE 0 END) AS "ordenes_vigentes"
            FROM ADMIN.ORDEN_COMPRA
        `);
        const customers = await connection.execute(`
            SELECT COUNT(*) AS "clientes"
            FROM ADMIN.CLIENTE
        `);
        const products = await connection.execute(`
            SELECT
                COUNT(*) AS "productos",
                SUM(CASE WHEN STOCK_ACTUAL <= 5 THEN 1 ELSE 0 END) AS "stock_bajo",
                NVL(SUM(STOCK_ACTUAL), 0) AS "unidades"
            FROM ADMIN.PRODUCTO
        `);

        res.json({ ...orders.rows[0], ...customers.rows[0], ...products.rows[0] });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/staff/resumen', requireStaff, async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                (SELECT COUNT(*) FROM ADMIN.ORDEN_COMPRA WHERE ESTADO IN ('PENDIENTE', 'PAGADO', 'PREPARANDO', 'ENVIADO')) AS "ordenes_vigentes",
                (SELECT COUNT(*) FROM ADMIN.PRODUCTO WHERE STOCK_ACTUAL <= 5) AS "stock_bajo",
                (SELECT COUNT(*) FROM ADMIN.PRODUCTO) AS "productos",
                (SELECT NVL(SUM(TOTAL_CON_IVA), 0) FROM ADMIN.ORDEN_COMPRA WHERE ESTADO <> 'CANCELADO') AS "ventas"
            FROM DUAL
        `);

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/staff/ordenes-vigentes', requireStaff, async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                o.ID_ORDEN AS "id_orden",
                o.ID_CLIENTE AS "id_cliente",
                c.NOMBRE_COMPLETO AS "cliente",
                c.CORREO AS "correo",
                o.FECHA_ORDEN AS "fecha_orden",
                o.TOTAL_CON_IVA AS "total_con_iva",
                o.ESTADO AS "estado",
                COUNT(d.ID_DETALLE) AS "lineas"
            FROM ADMIN.ORDEN_COMPRA o
            LEFT JOIN ADMIN.CLIENTE c ON c.ID_CLIENTE = o.ID_CLIENTE
            LEFT JOIN ADMIN.DETALLE_ORDEN d ON d.ID_ORDEN = o.ID_ORDEN
            WHERE o.ESTADO IN ('PENDIENTE', 'PAGADO', 'PREPARANDO', 'ENVIADO')
            GROUP BY
                o.ID_ORDEN,
                o.ID_CLIENTE,
                c.NOMBRE_COMPLETO,
                c.CORREO,
                o.FECHA_ORDEN,
                o.TOTAL_CON_IVA,
                o.ESTADO
            ORDER BY o.ID_ORDEN DESC
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/staff/stock', requireStaff, async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                p.ID_PRODUCTO AS "id_producto",
                p.CODIGO_SKU AS "codigo_sku",
                p.NOMBRE AS "nombre",
                p.STOCK_ACTUAL AS "stock",
                p.PRECIO_UNITARIO AS "precio",
                p.URL_GALERIA AS "imagen",
                c.NOMBRE AS "categoria"
            FROM ADMIN.PRODUCTO p
            LEFT JOIN ADMIN.CATEGORIA c ON c.ID_CATEGORIA = p.ID_CATEGORIA
            ORDER BY p.STOCK_ACTUAL ASC, p.NOMBRE ASC
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/admin/productos', requireAdmin, async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`${selectProductsSql} ORDER BY p.ID_PRODUCTO DESC`);
        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/admin/productos/:id', requireAdmin, async (req, res, next) => {
    let connection;
    const idProducto = Number(req.params.id);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Producto invalido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`${selectProductsSql} WHERE p.ID_PRODUCTO = :idProducto`, { idProducto });

        if (result.rows.length === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Producto no encontrado.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.put('/api/admin/productos/:id', requireAdmin, async (req, res, next) => {
    let connection;
    const idProducto = Number(req.params.id);
    const validation = validateProductPayload(req.body);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Producto invalido.' });
    }

    if (validation.error) {
        return res.status(400).json({ estado: 'ERROR', mensaje: validation.error });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            UPDATE ADMIN.PRODUCTO
            SET
                ID_CATEGORIA = :id_categoria,
                CODIGO_SKU = :codigo_sku,
                NOMBRE = :nombre,
                PRECIO_UNITARIO = :precio_unitario,
                STOCK_ACTUAL = :stock_actual,
                FICHA_TECNICA = :ficha_tecnica,
                URL_GALERIA = :url_galeria
            WHERE ID_PRODUCTO = :idProducto
        `, {
            ...validation.product,
            idProducto
        }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Producto no encontrado.' });
        }

        res.json({ estado: 'OK', mensaje: 'Producto actualizado.' });
    } catch (err) {
        if (err.errorNum === 1) {
            return res.status(409).json({ estado: 'ERROR', mensaje: 'Ya existe un producto con ese SKU.' });
        }
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.delete('/api/admin/productos/:id', requireAdmin, async (req, res, next) => {
    let connection;
    const idProducto = Number(req.params.id);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Producto invalido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            DELETE FROM ADMIN.PRODUCTO
            WHERE ID_PRODUCTO = :idProducto
        `, { idProducto }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Producto no encontrado.' });
        }

        res.json({ estado: 'OK', mensaje: 'Producto eliminado.' });
    } catch (err) {
        if (err.errorNum === 2292) {
            return res.status(409).json({
                estado: 'ERROR',
                mensaje: 'No se puede eliminar: el producto ya tiene movimientos u ordenes asociadas.'
            });
        }
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.post('/api/staff/productos', requireStaff, async (req, res, next) => {
    let connection;
    const role = getRequestRole(req);
    const userId = getRequestUserId(req);
    const validation = validateProductPayload(req.body);

    if (validation.error) {
        return res.status(400).json({ estado: 'ERROR', mensaje: validation.error });
    }

    try {
        connection = await database.getPool().getConnection();

        if (role === 'admin') {
            const idProducto = await insertProduct(connection, validation.product);
            await connection.commit();
            return res.status(201).json({
                estado: 'OK',
                mensaje: 'Producto creado y publicado.',
                data: { id_producto: idProducto }
            });
        }

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ estado: 'ERROR', mensaje: 'Usuario vendedor no identificado.' });
        }

        const result = await connection.execute(`
            INSERT INTO ADMIN.SOLICITUD_PRODUCTO (
                ID_USUARIO_SOLICITA,
                ID_CATEGORIA,
                CODIGO_SKU,
                NOMBRE,
                PRECIO_UNITARIO,
                STOCK_ACTUAL,
                FICHA_TECNICA,
                URL_GALERIA,
                ESTADO
            ) VALUES (
                :id_usuario,
                :id_categoria,
                :codigo_sku,
                :nombre,
                :precio_unitario,
                :stock_actual,
                :ficha_tecnica,
                :url_galeria,
                'PENDIENTE'
            ) RETURNING ID_SOLICITUD INTO :out_id
        `, {
            id_usuario: userId,
            ...validation.product,
            out_id: { type: database.getOracleDriver().NUMBER, dir: database.getOracleDriver().BIND_OUT }
        }, { autoCommit: true });

        res.status(201).json({
            estado: 'OK',
            mensaje: 'Producto enviado para aprobacion.',
            data: { id_solicitud: result.outBinds.out_id[0] }
        });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/staff/solicitudes-producto', requireStaff, async (req, res, next) => {
    let connection;
    const role = getRequestRole(req);
    const userId = getRequestUserId(req);

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                s.ID_SOLICITUD AS "id_solicitud",
                s.ID_PRODUCTO AS "id_producto",
                s.ID_USUARIO_SOLICITA AS "id_usuario_solicita",
                u.NOMBRE AS "solicitante",
                s.ID_CATEGORIA AS "id_categoria",
                c.NOMBRE AS "categoria",
                s.CODIGO_SKU AS "codigo_sku",
                s.NOMBRE AS "nombre",
                s.PRECIO_UNITARIO AS "precio_unitario",
                s.STOCK_ACTUAL AS "stock_actual",
                s.FICHA_TECNICA AS "ficha_tecnica",
                s.URL_GALERIA AS "url_galeria",
                s.ESTADO AS "estado",
                s.OBSERVACIONES AS "observaciones",
                s.CREATED_AT AS "created_at",
                s.VALIDATED_AT AS "validated_at"
            FROM ADMIN.SOLICITUD_PRODUCTO s
            LEFT JOIN ADMIN.USUARIO_PORTAL u ON u.ID_USUARIO = s.ID_USUARIO_SOLICITA
            LEFT JOIN ADMIN.CATEGORIA c ON c.ID_CATEGORIA = s.ID_CATEGORIA
            WHERE (:role = 'admin' OR s.ID_USUARIO_SOLICITA = :userId)
            ORDER BY s.CREATED_AT DESC
        `, { role, userId });

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.patch('/api/admin/solicitudes-producto/:id', requireAdmin, async (req, res, next) => {
    let connection;
    const id = Number(req.params.id);
    const action = String(req.body.action || '').toLowerCase();
    const adminId = getRequestUserId(req) || null;
    const observaciones = req.body.observaciones ? String(req.body.observaciones).trim() : null;

    if (!Number.isInteger(id) || id <= 0 || !['aprobar', 'denegar'].includes(action)) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Solicitud invalida.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                ID_SOLICITUD AS "id_solicitud",
                ID_CATEGORIA AS "id_categoria",
                CODIGO_SKU AS "codigo_sku",
                NOMBRE AS "nombre",
                PRECIO_UNITARIO AS "precio_unitario",
                STOCK_ACTUAL AS "stock_actual",
                FICHA_TECNICA AS "ficha_tecnica",
                URL_GALERIA AS "url_galeria",
                ESTADO AS "estado"
            FROM ADMIN.SOLICITUD_PRODUCTO
            WHERE ID_SOLICITUD = :id
            FOR UPDATE
        `, { id });

        const request = result.rows[0];
        if (!request) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Solicitud de producto no encontrada.' });
        }

        if (request.estado !== 'PENDIENTE') {
            return res.status(409).json({ estado: 'ERROR', mensaje: 'Esta solicitud ya fue procesada.' });
        }

        let idProducto = null;
        const estado = action === 'aprobar' ? 'APROBADO' : 'DENEGADO';

        if (estado === 'APROBADO') {
            idProducto = await insertProduct(connection, request);
        }

        await connection.execute(`
            UPDATE ADMIN.SOLICITUD_PRODUCTO
            SET ESTADO = :estado,
                ID_PRODUCTO = :idProducto,
                ID_USUARIO_VALIDA = :adminId,
                OBSERVACIONES = :observaciones,
                VALIDATED_AT = SYSTIMESTAMP
            WHERE ID_SOLICITUD = :id
        `, { estado, idProducto, adminId, observaciones, id });

        await connection.commit();
        res.json({
            estado: 'OK',
            mensaje: estado === 'APROBADO' ? 'Producto aprobado y publicado.' : 'Solicitud de producto denegada.',
            data: { id_producto: idProducto }
        });
    } catch (err) {
        if (connection) await connection.rollback();
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/admin/ordenes', requireAdmin, async (req, res, next) => {
    let connection;

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            SELECT
                o.ID_ORDEN AS "id_orden",
                o.ID_CLIENTE AS "id_cliente",
                c.NOMBRE_COMPLETO AS "cliente",
                c.CORREO AS "correo",
                o.FECHA_ORDEN AS "fecha_orden",
                o.SUBTOTAL AS "subtotal",
                o.MONTO_IVA AS "monto_iva",
                o.TOTAL_CON_IVA AS "total_con_iva",
                o.CUOTAS_VISACUOTAS AS "cuotas_visacuotas",
                o.ESTADO AS "estado",
                COUNT(d.ID_DETALLE) AS "lineas"
            FROM ADMIN.ORDEN_COMPRA o
            LEFT JOIN ADMIN.CLIENTE c ON c.ID_CLIENTE = o.ID_CLIENTE
            LEFT JOIN ADMIN.DETALLE_ORDEN d ON d.ID_ORDEN = o.ID_ORDEN
            GROUP BY
                o.ID_ORDEN,
                o.ID_CLIENTE,
                c.NOMBRE_COMPLETO,
                c.CORREO,
                o.FECHA_ORDEN,
                o.SUBTOTAL,
                o.MONTO_IVA,
                o.TOTAL_CON_IVA,
                o.CUOTAS_VISACUOTAS,
                o.ESTADO
            ORDER BY o.ID_ORDEN DESC
        `);

        res.json(result.rows);
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.patch('/api/admin/ordenes/:id', requireStaff, async (req, res, next) => {
    let connection;
    const idOrden = Number(req.params.id);
    const estado = String(req.body.estado || '').trim().toUpperCase();
    const estadosPermitidos = ['PENDIENTE', 'PAGADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];

    if (!Number.isInteger(idOrden) || idOrden <= 0 || !estadosPermitidos.includes(estado)) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Estado u orden invalida.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const result = await connection.execute(`
            UPDATE ADMIN.ORDEN_COMPRA
            SET ESTADO = :estado
            WHERE ID_ORDEN = :idOrden
        `, { estado, idOrden }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return res.status(404).json({ estado: 'ERROR', mensaje: 'Orden no encontrada.' });
        }

        res.json({ estado: 'OK', mensaje: 'Estado actualizado.' });
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/api/mis-ordenes/:idCliente', async (req, res, next) => {
    let connection;
    const idCliente = Number(req.params.idCliente);

    if (!Number.isInteger(idCliente) || idCliente <= 0) {
        return res.status(400).json({ estado: 'ERROR', mensaje: 'Cliente invalido.' });
    }

    try {
        connection = await database.getPool().getConnection();
        const orders = await connection.execute(`
            SELECT
                ID_ORDEN AS "id_orden",
                FECHA_ORDEN AS "fecha_orden",
                SUBTOTAL AS "subtotal",
                MONTO_IVA AS "monto_iva",
                TOTAL_CON_IVA AS "total_con_iva",
                CUOTAS_VISACUOTAS AS "cuotas_visacuotas",
                ESTADO AS "estado"
            FROM ADMIN.ORDEN_COMPRA
            WHERE ID_CLIENTE = :idCliente
            ORDER BY ID_ORDEN DESC
        `, { idCliente });

        const details = await connection.execute(`
            SELECT
                d.ID_ORDEN AS "id_orden",
                d.ID_PRODUCTO AS "id_producto",
                p.NOMBRE AS "producto",
                d.CANTIDAD AS "cantidad",
                d.PRECIO_UNITARIO AS "precio_unitario",
                d.SUBTOTAL_LINEA AS "subtotal_linea"
            FROM ADMIN.DETALLE_ORDEN d
            LEFT JOIN ADMIN.PRODUCTO p ON p.ID_PRODUCTO = d.ID_PRODUCTO
            WHERE d.ID_ORDEN IN (
                SELECT ID_ORDEN
                FROM ADMIN.ORDEN_COMPRA
                WHERE ID_CLIENTE = :idCliente
            )
            ORDER BY d.ID_ORDEN DESC, d.ID_DETALLE ASC
        `, { idCliente });

        const detailsByOrder = details.rows.reduce((map, detail) => {
            if (!map.has(detail.id_orden)) map.set(detail.id_orden, []);
            map.get(detail.id_orden).push(detail);
            return map;
        }, new Map());

        res.json(orders.rows.map((order) => ({
            ...order,
            detalle: detailsByOrder.get(order.id_orden) || []
        })));
    } catch (err) {
        next(err);
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;
