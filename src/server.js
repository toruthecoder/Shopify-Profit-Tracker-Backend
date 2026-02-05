import express from 'express'
import dotenv from 'dotenv'
import passport from 'passport'
import session from 'express-session';
import Auth from './contollers/auth.js'
import { connectDB } from './config/db.js'

dotenv.config()

const app = express();
const PORT = 3002

connectDB()

app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

Auth()
app.get('/', (_, res) => {
    res.send('Hello World from Express! 🔥');
});

app.get('/auth/shopify', (req, res, next) => {
    passport.authenticate('shopify', {
        scope: ['read_orders', 'read_products', 'read_refunds'],
        shop: req.query.shop,
    })(req, res, next);
});

app.get(
    '/auth/shopify/callback',
    passport.authenticate('shopify', { failureRedirect: '/login' }),
    function (_, res) {
        // Successful authentication, redirect home.
        res.redirect('/')
    })

app.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
});

export default app;