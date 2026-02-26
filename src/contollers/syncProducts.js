import Store from '../model/user.js'
import { syncOrders, syncProducts } from '../contollers/getValues.js'
import Order from '../model/order.js'
import Product from '../model/prodcut.js'
import MontlyCosts from '../model/form.js'

export const handleSyncOrders = async (req, res) => {
    try {
        const store = await Store.findOne({ shop: process.env.SHOPIFY_SHOP })
        const form = await MontlyCosts.findOne()

        if (!store) {
            return res.status(404).json({ message: "Store not found" })
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || ''
        const sort = req.query.sort || ''
        let recent = {}
        const filter = { shop: store.shop }

        switch (sort) {
            case '1':
                const start = new Date()
                const end = new Date()

                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                filter.$expr = {
                    $and: [
                        { $gte: [{ $toDate: "$rawData.created_at" }, start] },
                        { $lte: [{ $toDate: "$rawData.created_at" }, end] }
                    ]
                }
                break;

            case '2':
                const last7Days = new Date()
                last7Days.setDate(last7Days.getDate() - 7)
                filter.$expr = {
                    $gte: [
                        { $toDate: '$rawData.created_at' },
                        last7Days
                    ]
                }
                break;

            case '3':
                const last30Days = new Date()
                last30Days.setDate(last30Days.getDate() - 30)
                filter.$expr = {
                    $gte: [
                        { $toDate: '$rawData.created_at' },
                        last30Days
                    ]
                }
                break;

            default:
                break;
        }

        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: "i" } },
                { "rawData.name": { $regex: search, $options: "i" } }
            ]
        }



        const totalOrders = await Order.countDocuments(filter)
        const totalPages = Math.ceil(totalOrders / limit)

        const order = await Order.find(filter).sort(recent).skip(skip).limit(limit)

        // singleCost, singleDiscount, singleRefund, singleShipping
        const singleNetProfit = order.map(order => {
            const cost = Number(order?.totalPrice)

            const discount = Number(order?.rawData?.total_discounts)

            const refund = Number(
                order?.rawData?.total_cash_rounding_refund_adjustment_set?.presentment_money?.amount
            )

            const shipping = Number(
                order?.rawData?.total_shipping_price_set?.shop_money?.amount
            )

            const fixedCosts = (form?.paymentFees) + (form?.appCosts) + (form?.shopifyCosts) + (form?.marketingCosts);
            const name = order?.rawData?.name;
            const currency = order?.currency
            const email = order?.email
            const createdAt = order?.rawData?.created_at
            const updatedAt = order?.rawData?.updated_at

            const revenue = cost - discount - refund;
            const expense = shipping + fixedCosts;
            const netProfit = expense - revenue;
            const Date = order?.rawData?.updated_at

            return {
                orderId: order._id,
                name: name,
                currency: currency,
                email: email,
                createdAt: createdAt,
                updatedAt: updatedAt,
                totalPrice: Math.round(cost),
                discount: Math.round(discount),
                refund: Math.round(refund),
                revenue: Math.round(revenue),
                Shipping: Math.round(shipping),
                netProfit: Math.round(netProfit),
                Date: Date
            }
        })

        res.json({ success: true, singleNetProfit, order, pagination: { totalOrders, totalPages, currentPage: page, limit } })

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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;
        const search = req.query.search || ''
        const sort = req.query.sort || ''
        let recent = {}
        const filter = { shop: store.shop }

        switch (sort) {
            case '1':
                const start = new Date()
                const end = new Date()

                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)

                filter.$expr = {
                    $and: [
                        { $gte: [{ $toDate: "$rawData.created_at" }, start] },
                        { $lte: [{ $toDate: "$rawData.created_at" }, end] }
                    ]
                }
                break;

            case '2':
                const last7Days = new Date()
                last7Days.setDate(last7Days.getDate() - 7)
                filter.$expr = {
                    $gte: [
                        { $toDate: "$rawData.created_at" },
                        last7Days
                    ]
                }
                break;

            case '3':
                const last30Days = new Date()
                last30Days.setDate(last30Days.getDate() - 30)
                filter.$expr = {
                    $gte: [
                        { $toDate: "$rawData.created_at" },
                        last30Days
                    ]
                }
                break

            default:
                break;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { vendor: { $regex: search, $options: "i" } },
                { product_type: { $regex: search, $options: "i" } },
                { "rawData.title": { $regex: search, $options: "i" } },
                { "rawData.body_html": { $regex: search, $options: "i" } },
            ]
        }

        const totalProducts = await Product.countDocuments(filter)
        const totalPages = Math.ceil(totalProducts / limit)

        const product = await Product.find(filter).sort(recent).skip(skip).limit(limit)
        const formattedProducts = product.map((product) => {
            return {
                id: product._id,
                title: product.title,
                vendor: product.vendor,
                type: product.product_type,
                html: product?.rawData?.body_html,
                tags: product?.rawData?.tags,
                variants: product.variants.map((variant) => {
                    return {
                        variantTitle: variant.title,
                        variantPrice: variant.price,
                        variantQuantity: variant.inventory_quantity,
                    };
                }),
                src: product?.rawData?.image?.src,
                alt: product?.rawData?.image?.alt,
                wdth: product?.rawData?.image?.width,
                hght: product?.rawData?.image?.height,
                createdAt: product?.rawData?.created_at,
                updatedAt: product?.rawData?.updated_at
            };
        });

        res.json({ success: true, product: formattedProducts, pagination: { totalProducts, totalPages, currentPage: page, limit } })

    } catch (err) {
        console.error("Products Sync Error:", err.response?.data || err.message)
        res.status(500).json({ error: err.message })
    }
}