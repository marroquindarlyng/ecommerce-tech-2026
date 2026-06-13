const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });
const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

if (process.env.DB_USE_THICK === 'true') {
    oracledb.initOracleClient({ configDir: process.env.TNS_ADMIN });
}

const sqlPath = path.resolve(__dirname, '../../database/portal_users_and_product_requests.sql');

const splitStatements = (content) => content
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim())
    .filter(Boolean);

(async () => {
    const connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECTION_STRING
    });

    const statements = splitStatements(fs.readFileSync(sqlPath, 'utf8'));

    for (const statement of statements) {
        const label = statement.slice(0, 80).replace(/\s+/g, ' ');
        try {
            await connection.execute(statement);
            console.log(`OK: ${label}`);
        } catch (err) {
            console.error(`ERROR: ${label}`);
            console.error(err.message);
            throw err;
        }
    }

    await connection.close();
})().catch(() => {
    process.exit(1);
});
