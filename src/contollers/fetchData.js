import Product from '../model/prodcut.js'
import Order from '../model/order.js'
import Return from '../model/returns.js'

export const fetchData = async (req, res) => {
    try {
        const shop = process.env.SHOPIFY_SHOP
        const orders = await Order.find({ shop })
        const returns = await Return.find({ shop })
        const products = await Product.find({})

        res.json({
            success: true,
            stats: {
                totalOrders: orders.length,
                totalReturns: returns.length,
                totalProducts: products.length,
            },
            orders,
            returns,
            products,
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}