import Orders from '../model/order.js'
import Returns from '../model/returns.js'
import Product from '../model/prodcut.js'
import axios from 'axios'

export const syncOrders = async (shop, accessToken) => {
    let url = `https://${shop}/admin/api/2024-10/orders.json?limit=250&status=any`
    while (url) {
        const { data, headers } = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': accessToken
            }
        })

        for (const order of data.orders) {
            await Orders.updateOne(
                { shop, orderId: order.id },
                {
                    shop,
                    orderId: order.id,
                    email: order.email,
                    totalPrice: order.total_price,
                    currency: order.currency,
                    rawData: order
                }, { upsert: true }
            )

            for (const refund of order.returns || []) {
                await Returns.updateOne(
                    { shop, refundId: refund.id },
                    {
                        shop,
                        refundId: refund.id,
                        orderId: order.id,
                        currency: order.currency,
                        totalRefunded: refund.transactions?.[0]?.amount,
                        transactions: refund.transactions,
                        refundLineItems: refund.refund_line_items.map(item => ({
                            lineItemId: item.line_item_id,
                            quantity: item.quantity,
                            subtotal: item.subtotal,
                            totalTax: item.total_tax
                        })),
                        createdAtShopify: refund.created_at,
                        rawData: refund
                    },
                    { upsert: true }
                )
            }
        }

        const link = headers.link
        if (link && link.includes('rel="next"')) {
            url = link.match(/<([^>]+)>;\s*rel="next"/)[1]
        } else {
            url = null
        }
    }
    console.log(`orders + refunds synced for ${shop}`)
}

export const syncProducts = async (shop, accessToken) => {
    let url = `https://${shop}/admin/api/2024-10/products.json?limit=250`
    while (url) {
        const { data, headers } = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': accessToken
            }
        })

        for (const payload of data.products) {
            await Product.updateOne(
                { _id: payload.id, shop },
                {
                    shop,
                    admin_graphql_api_id: payload.admin_graphql_api_id,
                    title: payload.title,
                    handle: payload.handle,
                    body_html: payload.body_html,

                    vendor: payload.vendor,
                    product_type: payload.product_type,
                    status: payload.status,
                    tags: payload.tags ? payload.tags.split(',').map(t => t.trim()) : [],
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
                    updated_at: payload.updated_at,
                    rawData: payload
                },
                { upsert: true }
            )
        }

        const link = headers.link
        if (link && link.includes('rel="next"')) {
            url = link.match(/<([^>]+)>;\s*rel="next"/)[1]
        } else {
            url = null
        }
    }

    console.log(`Products synced for ${shop}`)
}