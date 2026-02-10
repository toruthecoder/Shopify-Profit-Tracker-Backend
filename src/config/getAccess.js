import Store from '../model/user.js'

// This is the offline access token for background operations
export const getAccess = async (_, res) => {
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
}