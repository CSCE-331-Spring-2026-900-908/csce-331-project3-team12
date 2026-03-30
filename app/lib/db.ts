import pkg from "pg";

const { Pool } = pkg;

// Check if SSL should be used
const useSSL = process.env.DB_SSL === "true";

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
  ssl: useSSL
    ? { rejectUnauthorized: false }
    : false,
});

export default pool;