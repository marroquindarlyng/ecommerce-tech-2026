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

    const tables = await connection.execute(`
        SELECT table_name
        FROM all_tables
        WHERE owner = 'ADMIN'
          AND table_name IN ('USUARIO_PORTAL', 'SOLICITUD_PRODUCTO', 'PRODUCTO', 'CATEGORIA')
        ORDER BY table_name
    `);

    console.log('TABLES');
    console.log(JSON.stringify(tables.rows, null, 2));

    const columns = await connection.execute(`
        SELECT table_name, column_name, data_type, nullable
        FROM all_tab_columns
        WHERE owner = 'ADMIN'
          AND table_name IN ('PRODUCTO', 'CATEGORIA', 'USUARIO_PORTAL', 'SOLICITUD_PRODUCTO')
        ORDER BY table_name, column_id
    `);

    console.log('COLS');
    for (const row of columns.rows) {
        console.log(`${row.TABLE_NAME}.${row.COLUMN_NAME} ${row.DATA_TYPE} ${row.NULLABLE}`);
    }

    await connection.close();
})().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
