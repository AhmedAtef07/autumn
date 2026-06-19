// Enable Postgres extensions the autumn schema needs before migrations run.
// Migration 0014+ create GIN trigram indexes (gin_trgm_ops) which require the
// pg_trgm extension; without it, `bun scripts/db migrate` fails. Idempotent.
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
	console.error("db-extensions: DATABASE_URL not set");
	process.exit(1);
}

const EXTENSIONS = ["pg_trgm", "btree_gin", "uuid-ossp", "citext"];

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
	for (const ext of EXTENSIONS) {
		try {
			await client.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
			console.log(`db-extensions: ensured ${ext}`);
		} catch (e) {
			console.error(`db-extensions: could not create ${ext}:`, (e as Error).message);
		}
	}
} finally {
	await client.end();
}
