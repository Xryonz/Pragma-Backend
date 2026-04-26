require('dotenv').config()

const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
const passport = require('./middleware/passport')
app.use(passport.initialize())
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
)

app.listen(PORT, () => console.log(`🚀 Backend rodando em http://localhost:${PORT}`))
