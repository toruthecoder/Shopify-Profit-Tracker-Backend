import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import storeRoute from './routes/storeRoute.js'
import setRoute from './routes/setRoute.js'

dotenv.config()

const app = express()
const PORT = 3002

connectDB()

app.use('/setup-store', storeRoute)
app.use('/store', express.raw({ type: 'application/json' }), setRoute)
app.use(express.json())

app.get('/', (_, res) => { res.send('Hello World I am in. from Express! 🔥') })

app.listen(PORT, () => { console.log(`Server is running on PORT:${PORT}`) })

export default app