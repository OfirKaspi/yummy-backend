// import path from 'path'
import * as dotenv from 'dotenv'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile })
console.log(`Using environment file: ${envFile}`)

import app from './app'
import { connectToDatabase } from './config/db'

connectToDatabase()
    .then(() => console.log("Connected to database"))
    .catch((error) => {
        console.error("Failed to connect to database", error)
        process.exit(1)
    })

const PORT = process.env.PORT || 7000
app.listen(PORT, () => {
    console.log(`Listening on port http://${process.env.HOST}:${PORT}`)
})
