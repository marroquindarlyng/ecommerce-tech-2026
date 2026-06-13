const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });
const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

if (process.env.DB_USE_THICK === 'true') {
    oracledb.initOracleClient({ configDir: process.env.TNS_ADMIN });
}

const sourcePath = path.resolve(__dirname, '../src/portal-users.json');

const normalizeUser = (user) => ({
    id_cliente: user.id_cliente || null,
    nombre: user.nombre,
    correo: String(user.correo || '').trim().toLowerCase(),
    password_hash: user.password,
    password_salt: user.salt,
    rol: user.rol,
    estado: user.estado || 'PENDIENTE',
    nit: user.nit || 'CF',
    telefono: user.telefono || null,
    direccion_envio: user.direccion_envio || null
});

(async () => {
    if (!fs.existsSync(sourcePath)) {
        console.log('No existe portal-users.json local. No hay usuarios que migrar.');
        return;
    }

    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    const users = (source.users || []).map(normalizeUser).filter((user) => user.correo && user.password_hash && user.password_salt);

    const connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECTION_STRING
    });

    for (const user of users) {
        await connection.execute(`
            MERGE INTO ADMIN.USUARIO_PORTAL u
            USING (
                SELECT
                    :id_cliente AS ID_CLIENTE,
                    :nombre AS NOMBRE,
                    :correo AS CORREO,
                    :password_hash AS PASSWORD_HASH,
                    :password_salt AS PASSWORD_SALT,
                    :rol AS ROL,
                    :estado AS ESTADO,
                    :nit AS NIT,
                    :telefono AS TELEFONO,
                    :direccion_envio AS DIRECCION_ENVIO
                FROM DUAL
            ) src
            ON (u.CORREO = src.CORREO)
            WHEN MATCHED THEN UPDATE SET
                u.ID_CLIENTE = src.ID_CLIENTE,
                u.NOMBRE = src.NOMBRE,
                u.PASSWORD_HASH = src.PASSWORD_HASH,
                u.PASSWORD_SALT = src.PASSWORD_SALT,
                u.ROL = src.ROL,
                u.ESTADO = src.ESTADO,
                u.NIT = src.NIT,
                u.TELEFONO = src.TELEFONO,
                u.DIRECCION_ENVIO = src.DIRECCION_ENVIO
            WHEN NOT MATCHED THEN INSERT (
                ID_CLIENTE,
                NOMBRE,
                CORREO,
                PASSWORD_HASH,
                PASSWORD_SALT,
                ROL,
                ESTADO,
                NIT,
                TELEFONO,
                DIRECCION_ENVIO,
                VALIDATED_AT
            ) VALUES (
                src.ID_CLIENTE,
                src.NOMBRE,
                src.CORREO,
                src.PASSWORD_HASH,
                src.PASSWORD_SALT,
                src.ROL,
                src.ESTADO,
                src.NIT,
                src.TELEFONO,
                src.DIRECCION_ENVIO,
                CASE WHEN src.ESTADO = 'APROBADO' THEN SYSTIMESTAMP ELSE NULL END
            )
        `, user);
        console.log(`Migrado: ${user.correo}`);
    }

    await connection.commit();
    await connection.close();
})();
