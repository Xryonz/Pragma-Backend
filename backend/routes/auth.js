// routes/auth.js — Cadastro e Login
// ─────────────────────────────────────────────────────────────
// 📚 PostgreSQL: tabela necessária (rode setup.sql antes!)
//
//   CREATE TABLE users (
//     id         SERIAL PRIMARY KEY,
//     name       VARCHAR(100) NOT NULL,
//     email      VARCHAR(255) UNIQUE NOT NULL,
//     password   VARCHAR(255),
//     provider   VARCHAR(50) DEFAULT 'local',
//     created_at TIMESTAMPTZ DEFAULT NOW()
//   );
// ─────────────────────────────────────────────────────────────

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Preencha todos os campos.' })
  if (password.length < 6)
    return res.status(400).json({ error: 'Senha: mínimo 6 caracteres.' })

  try {
    // 📚 SELECT com WHERE + parâmetro $1 (evita SQL Injection)
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'Email já cadastrado.' })

    const hash = await bcrypt.hash(password, 10)

    // 📚 INSERT com RETURNING — devolve a linha criada automaticamente
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    )

    const user = result.rows[0]
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: 'Email e senha obrigatórios.' })

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND provider = $2',
      [email, 'local']
    )
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Email ou senha incorretos.' })

    const user = result.rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match)
      return res.status(401).json({ error: 'Email ou senha incorretos.' })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro interno.' })
  }
})

module.exports = router
