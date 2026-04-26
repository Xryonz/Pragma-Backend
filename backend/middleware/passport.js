const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const pool = require('../db')

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://pragma-backend-production.up.railway.app/api/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value
        const name = profile.displayName

        // Verifica se o usuário já existe
        const existing = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
)

if (existing.rows.length > 0) {
  return done(null, existing.rows[0])
}
        // Cria novo usuário
        const result = await pool.query(
          'INSERT INTO users (name, email, provider) VALUES ($1, $2, $3) RETURNING *',
          [name, email, 'google']
        )

        return done(null, result.rows[0])
      } catch (err) {
        return done(err)
      }
    }
  )
)

module.exports = passport