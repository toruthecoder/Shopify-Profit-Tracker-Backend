import passport from 'passport'
import pkg from 'passport-shopify';
const ShopifyStrategy = pkg.Strategy;

const Auth = () => {
    try {
        passport.use(
            new ShopifyStrategy({
                clientID: process.env.SHOPIFY_CLIENT_ID,
                clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
                callbackURL: process.env.CALLBACK_URL,
                // shop: process.env.SHOPIFY_SHOP_SLUG,
            },
                (accessToken, refreshToken, profile, done) => {
                    return done(null, profile);
                })
        )
    } catch (error) {
        console.log(error)
    }
}
export default Auth;