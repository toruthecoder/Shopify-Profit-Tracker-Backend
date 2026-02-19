import Store from '../model/user.js'
import { syncOrders, syncProducts } from '../contollers/getValues.js'
import Order from '../model/order.js'
import Product from '../model/prodcut.js'

export const handleSyncOrders = async (req, res) => {
    try {
        const store = await Store.findOne({ shop: process.env.SHOPIFY_SHOP })

        if (!store) {
            return res.status(404).json({ message: "Store not found" })
        }

        await syncOrders(store.shop, store.accessToken)

        const order = await Order.find({ shop: store.shop })
            .sort({ createdAt: -1 })
            .limit(50)

        res.json({ success: true, order })

    } catch (err) {
        console.error("Orders Sync Error:", err.response?.data || err.message)
        res.status(500).json({ error: err.message })
    }
}

export const handleSyncProducts = async (req, res) => {
    try {
        const store = await Store.findOne({ shop: process.env.SHOPIFY_SHOP })

        if (!store) {
            return res.status(404).json({ message: "Store not found" })
        }

        await syncProducts(store.shop, store.accessToken)

        const product = await Product.find()

        res.json({ success: true, product })

    } catch (err) {
        console.error("Products Sync Error:", err.response?.data || err.message)
        res.status(500).json({ error: err.message })
    }
}
