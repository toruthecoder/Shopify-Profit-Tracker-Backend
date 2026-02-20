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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        const totalProducts = await Product.countDocuments()
        const totalPages = Math.ceil(totalProducts / limit)

        const product = await Product.find().skip(skip).limit(limit)
        const formattedProducts = product.map((product) => {
            return {
                title: product.title,
                vendor: product.vendor,
                type: product.product_type,
                variants: product.variants.map((variant) => {
                    return {
                        variantTitle: variant.title,
                        variantPrice: variant.price,
                        variantQuantity: variant.inventory_quantity,
                    };
                })
            };
        });

        res.json({ success: true, product: formattedProducts, pagination: { totalProducts, totalPages, currentPage: page, limit } })

    } catch (err) {
        console.error("Products Sync Error:", err.response?.data || err.message)
        res.status(500).json({ error: err.message })
    }
}
