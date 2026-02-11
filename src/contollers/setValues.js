import crypto from 'crypto';
import Order from '../model/order.js'
import Refund from '../model/returns.js'
import Product from '../model/prodcut.js'

export const getOrders = async (req, res) => {
    try {
        const hmac = req.get('X-Shopify-Hmac-SHA256')
        const shopDomain = req.get('X-Shopify-Shop-Domain')
        const rawBody = req.body

        if (!hmac || !rawBody || !shopDomain) return res.status(400).send('Missing the Webhook')

        const generatedHash = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(rawBody).digest('base64')

        if (generatedHash !== hmac) return res.status(401).send('Unauthorized')
        const payload = JSON.parse(rawBody.toString())

        await Order.create({
            shop: shopDomain,
            orderId: payload.id,
            email: payload.email,
            totalPrice: payload.total_price,    
            currency: payload.currency,
            rawData: payload
        })

        console.log('Valid Data', payload)
        res.status(200).send('webhook Received and Verified')

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Server error');
    }
}

export const getRefunds = async (req, res) => {
    try {
        const hmac = req.get('X-Shopify-Hmac-SHA256')
        const shopDomain = req.get('X-Shopify-Shop-Domain')
        const rawBody = req.body

        if (!hmac || !shopDomain || !rawBody) return res.status(400).send('Missing the WebHook.');
        const generateHash = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(rawBody).digest('base64');

        if (generateHash !== hmac) return res.status(401).send('Unauthorized')
        const payload = JSON.parse(rawBody.toString())

        await Refund.create({
            shop: shopDomain,
            refundId: payload.id,
            orderId: payload.order_id,
            currency: payload.currency,
            totalRefunded: payload.transactions?.[0]?.amount,
            transactions: payload.transactions,
            refundLineItems: payload.refund_line_items.map(item => ({
                lineItemId: item.line_item_id,
                quantity: item.quantity,
                subtotal: item.subtotal,
                totalTax: item.total_tax
            })),
            createdAtShopify: payload.created_at,
            rawData: payload
        })

        console.log('ValidData : ', payload)
        res.status(200).send('webhook Received and Verified.')
    } catch (error) {
        console.error('Webhook error:', error)
        res.status(500).send('Server Error.')
    }
}

export const getProducts = async (req, res) => {
    try {
        const hmac = req.get('X-Shopify-Hmac-SHA256')
        const shopDomain = req.get('X-Shopify-Shop-Domain')
        const rawBody = req.body;

        if (!hmac || !shopDomain || !rawBody) return res.status(400).send('Missing the WebHook..');
        const generateHash = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET).update(rawBody).digest('base64');

        if (generateHash !== hmac) return res.status(401).send('UnAuthorized.');
        const payload = JSON.parse(rawBody.toString())

        await Product.findOneAndUpdate(
            { _id: payload.id },
            {
                admin_graphql_api_id: payload.admin_graphql_api_id,
                title: payload.title,
                handle: payload.handle,
                body_html: payload.body_html,
                vendor: payload.vendor,
                product_type: payload.product_type,
                status: payload.status,
                tags: payload.tags ? payload.tags.split(',').map(tag => tag.trim()) : [],
                variants: payload.variants.map(v => ({
                    id: v.id,
                    title: v.title,
                    price: v.price,
                    compare_at_price: v.compare_at_price,
                    sku: v.sku,
                    inventory_quantity: v.inventory_quantity,
                    option1: v.option1,
                    taxable: v.taxable,
                    updated_at: v.updated_at
                })),
                variant_gids: payload.variant_gids,
                updated_at: payload.updated_at || Date.now()
            },
            { upsert: true, new: true }
        );

        console.log('Valid-Data : ', payload)
        res.status(200).send('WebHook Received and Verified.')
    } catch (error) {
        console.error('WebHook Error : ', error)
        res.status(500).send('Server Error...')
    }
}