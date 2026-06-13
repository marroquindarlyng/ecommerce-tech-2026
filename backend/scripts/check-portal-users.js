require('dotenv').config({ path: '.env' });
const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

if (process.env.DB_USE_THICK === 'true') {
    oracledb.initOracleClient({ configDir: process.env.TNS_ADMIN });
}

(async () => {
    const connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECTION_STRING
    });

    const result = await connection.execute(`
        SELECT
            ID_USUARIO AS "id_usuario",
            ID_CLIENTE AS "id_cliente",
            NOMBRE AS "nombre",
            CORREO AS "correo",
            ROL AS "rol",
            ESTADO AS "estado",
            CREATED_AT AS "created_at",
            VALIDATED_AT AS "validated_at"
        FROM ADMIN.USUARIO_PORTAL
        ORDER BY ID_USUARIO
    `);

    console.log(JSON.stringify(result.rows, null, 2));
    await connection.close();
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
