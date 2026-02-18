import Product from '../model/prodcut.js'
import Order from '../model/order.js'
import Return from '../model/returns.js'

export const fetchData = async (req, res) => {
    try {
        const shop = process.env.SHOPIFY_SHOP
        const orders = await Order.find({ shop })
        const returns = await Return.find({ shop })
        const products = await Product.find({})

        // sales result
        const salesResult = orders.reduce((sum, order) => {
            return sum + parseFloat(order.totalPrice || 0)
        }, 0)

        // cutomer result
        const uniqeCustomer = new Set(
            orders.map(order => order?.email).filter(id => id)
        )
        const totalCustomer = uniqeCustomer.size

        // discount result 
        const totalDiscounts = orders.reduce((sum, order) => {
            return sum + parseFloat(order?.rawData?.total_discounts || 0)
        }, 0)

        // refunds results
        const totalRefundCosts = returns.reduce((sum, refund) => {
            return sum + parseFloat(refund?.totalRefunded)
        }, 0)

        // revenue results
        const totalRevenue = salesResult - totalDiscounts - totalRefundCosts

        // const totalCosts =
        //     totalCOGS +
        //     totalShipping +
        //     totalPaymentFees +
        //     totalTransactionFees +
        //     totalRefundCosts;

        // Total Expenses =
        //     Total COGS
        //   + Total Payment Fees
        //   + Total Shipping Cost
        //   + Total Refunds
        //   + Total Discounts
        //   + Fixed Monthly Costs (apps + Shopify plan)
        //   + Marketing Spend

        // Shipping results
        const totalShipping = orders.reduce((sum, order) => {
            return sum + parseFloat(order?.rawData?.total_shipping_price_set?.shop_money?.amount)
        }, 0)

        // total costs results
        const totalCosts = salesResult + totalShipping + totalRefundCosts;

        // total expenses result
        const totalExpenses = totalCosts + totalDiscounts;

        // total netprofit
        const netProfit = totalRevenue - totalExpenses

        // total profitMargin
        const profitMargin = (netProfit / totalRevenue) * 100;


        // singleCost, singleDiscount, singleRefund, singleShipping
        const singleNetProfit = orders.map(order => {
            const cost = Number(order?.totalPrice)

            const discount = Number(order?.rawData?.total_discounts)

            const refund = Number(
                order?.rawData?.total_cash_rounding_refund_adjustment_set?.presentment_money?.amount
            )

            const shipping = Number(
                order?.rawData?.total_shipping_price_set?.shop_money?.amount
            )

            const revenue = cost - discount - refund
            const expense = shipping
            const netProfit = revenue - expense

            return {
                orderId: order._id,
                totalPrice: Math.round(cost),
                discount: Math.round(discount),
                refund: Math.round(refund),
                revenue: Math.round(revenue),
                Shipping: Math.round(expense),
                netProfit: Math.round(netProfit)
            }
        })


        res.json({
            success: true,
            stats: {
                totalOrders: orders.length,
                totalReturns: returns.length,
                totalProducts: products.length,
                salesResult,
                totalCustomer,
                totalRevenue,
                totalCosts,
                totalRefundCosts,
                totalExpenses,
                netProfit,
                profitMargin,

            },
            orders,
            returns,
            products,
            singleNetProfit,
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}