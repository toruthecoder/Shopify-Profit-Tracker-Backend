import Store from '../model/user.js'
import { syncOrders, syncProducts } from '../contollers/getValues.js'

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

        const shop = store.shop
        const accessToken = store.accessToken

        if (!store.initialSyncDone) {
            console.log('starting initial sync')
            await syncOrders(shop, accessToken)
            await syncProducts(shop, accessToken)

            store.initialSyncDone = true;
            await store.save()

            console.log('Initial Sync Done.')
        }

        res.json({ success: true, shop: store.shop, accessToken: store.accessToken, initialSyncDone: store.initialSyncDone, message: `User Logged In Successfully.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}