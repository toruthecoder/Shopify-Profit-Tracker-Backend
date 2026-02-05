import passport from 'passport'
import pkg from 'passport-shopify';
const ShopifyStrategy = pkg.Strategy;
import Store from "../model/user.js";

const Auth = () => {
    passport.serializeUser((user, done) => {
        done(null, user.shop);
    });

    passport.deserializeUser(async (shop, done) => {
        try {
            const store = await Store.findOne({ shop });
            done(null, store);
        } catch (err) {
            done(err);
        }
    });

    passport.use(
        new ShopifyStrategy({
            clientID: process.env.SHOPIFY_CLIENT_ID,
            clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
            callbackURL: process.env.CALLBACK_URL,
        },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const shop = profile.myshopifyDomain;

                    const store = await Store.findOneAndUpdate(
                        { shop },
                        { accessToken, refreshToken },
                        { upsert: true, new: true, setDefaultsOnInsert: true, }
                    );

                    return done(null, store);
                } catch (err) {
                    return done(err);
                }
            }))
}
export default Auth;