// db.js — Pool de conexões com o PostgreSQL
// ─────────────────────────────────────────────────────────────
// 📚 PostgreSQL: Pool de conexões
//
// Abrir uma conexão com o banco tem um custo. Um Pool mantém
// várias conexões abertas e prontas para serem reutilizadas.
// Cada request "pega emprestado" uma conexão, usa, e devolve.
// Isso é muito mais eficiente do que abrir/fechar a cada request.
// ─────────────────────────────────────────────────────────────

const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'pragma_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 10,               // máximo de conexões simultâneas
  idleTimeoutMillis: 30000, // encerra conexão ociosa após 30s
})

pool.connect((err, _client, release) => {
  if (err) console.error('❌ Erro no PostgreSQL:', err.message)
  else { console.log('✅ PostgreSQL conectado!'); release() }
})

module.exports = pool
