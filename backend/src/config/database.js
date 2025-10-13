const { Pool } = require("pg");

const db = new Pool({
  host: "aws-1-us-east-2.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.sudpjidjsophvgdeyhkc",
  password: "#123987Aa#@21",
  ssl: { rejectUnauthorized: false },
});

// Verificar conexión
db.connect()
  .then(() => console.log("✅ Conectado a Supabase PostgreSQL"))
  .catch((err) => console.error("❌ Error al conectar:", err));

module.exports = db;