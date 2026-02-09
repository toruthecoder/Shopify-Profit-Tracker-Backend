import express from 'express'
import dotenv from 'dotenv'
// import Auth from './contollers/auth.js'
import { connectDB } from './config/db.js'
import https from "https";
import fs from "fs";
import Store from './model/user.js';


dotenv.config()

const options = {
    key: fs.readFileSync(
        new URL("../https/dashboard.key", import.meta.url)
    ),
    cert: fs.readFileSync(
        new URL("../https/dashboard.pem", import.meta.url)
    ),
};

const app = express();
const PORT = 3002

connectDB()

app.use(express.json())

app.get('/setup-store', async (_, res) => {
    try {
        const store = await Store.findOneAndUpdate(
            { shop: process.env.SHOPIFY_SHOP },
            {
                shop: process.env.SHOPIFY_SHOP,
                accessToken: process.env.SHOPIFY_ADMIN_TOKEN
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, store });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth()

app.get('/', (_, res) => {
    res.send('Hello World I am in. from Express! 🔥');
});

https.createServer(options, app).listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
});

export default app;