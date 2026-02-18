import Store from '../model/user.js'
import { syncOrders, syncProducts } from '../contollers/getValues.js'
import Order from '../model/order.js'
import Product from '../model/prodcut.js'

export const handleSyncOrders = async (req, res) => {
    try {
        const store = await Store.findOne()
        const order = await Order.find()

        if (!store) {
            return res.status(404).json({ message: "Store not found" })
        }

        await syncOrders(store.shop, store.accessToken)

        res.json({ success: true, order })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

export const handleSyncProducts = async (req, res) => {
    try {
        const store = await Store.findOne()
        const product = await Product.find()

        if (!store) {
            return res.status(404).json({ message: "Store not found" })
        }

        await syncProducts(store.shop, store.accessToken)

        res.json({ success: true, product })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}
