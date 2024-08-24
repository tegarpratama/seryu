import express from 'express'
import dotenv from 'dotenv'
import pool from './configs/db'
import route from './routes/indexRoute'

dotenv.config()
const app = express()

app.use(express.json())

async function checkDatabase() {
  try {
    const client = await pool.connect()
    console.log('Database connected')
    client.release()
  } catch (error) {
    console.error('Database connection failed:', error)
  }
}

checkDatabase()

app.use('/v1/check-health', (req, res, next) => {
  res.status(200).json({
    message: "It's work!",
  })
})

app.use('/v1/', route)

export default app
