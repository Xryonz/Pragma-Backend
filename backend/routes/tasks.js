// routes/tasks.js — CRUD completo de tarefas
// ─────────────────────────────────────────────────────────────
// 📚 PostgreSQL: tabela necessária (rode setup.sql antes!)
//
//   CREATE TABLE tasks (
//     id          SERIAL PRIMARY KEY,
//     user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//     title       VARCHAR(255) NOT NULL,
//     description TEXT,
//     deadline    DATE,
//     priority    VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
//     done        BOOLEAN DEFAULT FALSE,
//     created_at  TIMESTAMPTZ DEFAULT NOW(),
//     updated_at  TIMESTAMPTZ DEFAULT NOW()
//   );
//
// REFERENCES users(id) → chave estrangeira (garante integridade)
// ON DELETE CASCADE → apaga as tarefas se o usuário for deletado
// CHECK → restringe os valores aceitos (como um enum)
// ─────────────────────────────────────────────────────────────

const express = require('express')
const pool = require('../db')
const auth = require('../middleware/auth')

const router = express.Router()
router.use(auth) // todas as rotas exigem token JWT válido

// GET /api/tasks
router.get('/', async (req, res) => {
  const { filter } = req.query
  let where = 'user_id = $1'
  const params = [req.userId]

  if (filter === 'pending') where += ' AND done = false'
  if (filter === 'done') where += ' AND done = true'

  try {
    // 📚 ORDER BY — pendentes primeiro, depois mais recentes
    const result = await pool.query(
      `SELECT * FROM tasks WHERE ${where} ORDER BY done ASC, created_at DESC`,
      params
    )
    res.json({ tasks: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao buscar tarefas.' })
  }
})

// POST /api/tasks
router.post('/', async (req, res) => {
  const { title, description, deadline, priority = 'medium' } = req.body
  if (!title?.trim())
    return res.status(400).json({ error: 'Título obrigatório.' })

  try {
    // 📚 INSERT com RETURNING — devolve a linha inteira após inserir
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, deadline, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, title.trim(), description || null, deadline || null, priority]
    )
    res.status(201).json({ task: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao criar tarefa.' })
  }
})

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  const { title, description, deadline, priority, done } = req.body

  try {
    // 📚 COALESCE(novo_valor, valor_atual) — mantém o valor atual se não enviar o campo
    // Sempre filtre por user_id para garantir que só o dono edita a tarefa!
    const result = await pool.query(
      `UPDATE tasks
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           deadline    = COALESCE($3, deadline),
           priority    = COALESCE($4, priority),
           done        = COALESCE($5, done),
           updated_at  = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, description, deadline, priority, done, req.params.id, req.userId]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Tarefa não encontrada.' })
    res.json({ task: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' })
  }
})

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    // 📚 DELETE com RETURNING — confirma que a linha foi de fato deletada
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Tarefa não encontrada.' })
    res.json({ message: 'Tarefa excluída.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao excluir tarefa.' })
  }
})

module.exports = router
