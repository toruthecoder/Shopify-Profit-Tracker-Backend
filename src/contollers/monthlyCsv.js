import fastcsv from 'fast-csv';
import Order from '../model/order.js';
import Product from '../model/prodcut.js';
import Return from '../model/returns.js';
import MontlyCosts from '../model/form.js';

export const handleMonthlyCsv = async (req, res) => {
    try {
        const shop = req.query.shop || process.env.SHOPIFY_SHOP;

        const orders = await Order.find({ shop });
        const returns = await Return.find({ shop });
        const products = await Product.find({});
        const form = await MontlyCosts.findOne();

        const statsByMonth = {};

        orders.forEach(order => {
            const dateStr = order?.rawData?.updated_at || order?.updatedAt || order?.createdAt;

            if (!dateStr) {
                console.warn('Order missing date:', order?._id);
                return; // Skip orders without dates
            }

            let date;
            try {
                date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    console.warn('Invalid date for order:', order?._id, dateStr);
                    return;
                }
            } catch (e) {
                console.warn('Error parsing date for order:', order?._id, dateStr);
                return;
            }

            const monthKey = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}`;

            if (!statsByMonth[monthKey]) {
                statsByMonth[monthKey] = {
                    month: monthKey,
                    totalOrders: 0,
                    totalReturns: 0,
                    totalProducts: 0,
                    salesResult: 0,
                    totalDiscounts: 0,
                    totalRefundCosts: 0,
                    totalShipping: 0,
                    totalExpenses: 0,
                    netProfit: 0,
                    profitMargin: 0
                };
            }

            const cost = Number(order?.totalPrice || 0);
            const discount = Number(order?.rawData?.total_discounts || 0);
            const shipping = Number(order?.rawData?.total_shipping_price_set?.shop_money?.amount || 0);

            statsByMonth[monthKey].totalOrders += 1;
            statsByMonth[monthKey].salesResult += cost;
            statsByMonth[monthKey].totalDiscounts += discount;
            statsByMonth[monthKey].totalShipping += shipping;
        });

        returns.forEach(refund => {
            const dateStr = refund?.createdAtShopify || refund?.createdAt || refund?.updatedAt;
            if (!dateStr) {
                console.warn('Refund missing date:', refund?._id);
                return;
            }

            let date;
            try {
                date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    console.warn('Invalid date for refund:', refund?._id, dateStr);
                    return;
                }
            } catch (e) {
                console.warn('Error parsing date for refund:', refund?._id, dateStr);
                return;
            }

            const monthKey = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}`;
            if (!statsByMonth[monthKey]) {
                statsByMonth[monthKey] = {
                    month: monthKey,
                    totalOrders: 0,
                    totalReturns: 0,
                    totalProducts: 0,
                    salesResult: 0,
                    totalDiscounts: 0,
                    totalRefundCosts: 0,
                    totalShipping: 0,
                    totalExpenses: 0,
                    netProfit: 0,
                    profitMargin: 0
                };
            }

            statsByMonth[monthKey].totalRefundCosts += Number(refund?.totalRefunded) || 0;
        });

        Object.values(statsByMonth).forEach(stat => {
            const ordersCount = stat.totalOrders;
            const packagingCosts = (form?.packagingCosts || 0) * ordersCount;
            const deliveryCosts = (form?.deliveryCosts || 0) * ordersCount;
            const fixedCosts = (form?.paymentFees || 0) +
                (form?.appCosts || 0) +
                (form?.shopifyCosts || 0) +
                (form?.marketingCosts || 0);

            const totalRevenue = stat.salesResult - stat.totalDiscounts - stat.totalRefundCosts;

            stat.totalProducts = products.length;
            stat.totalReturns = returns.length;
            stat.totalExpenses = stat.totalShipping + stat.totalRefundCosts + stat.totalDiscounts + packagingCosts + deliveryCosts + fixedCosts;
            stat.netProfit = totalRevenue - stat.totalExpenses;
            stat.profitMargin = stat.salesResult ? Number(((stat.netProfit / stat.salesResult) * 100).toFixed(2)) : 0;

            stat.salesResult = Number(stat.salesResult.toFixed(2));
            stat.totalDiscounts = Number(stat.totalDiscounts.toFixed(2));
            stat.totalRefundCosts = Number(stat.totalRefundCosts.toFixed(2));
            stat.totalShipping = Number(stat.totalShipping.toFixed(2));
            stat.totalExpenses = Number(stat.totalExpenses.toFixed(2));
            stat.netProfit = Number(stat.netProfit.toFixed(2));
        });

        const csvData = Object.values(statsByMonth).sort((a, b) => a.month.localeCompare(b.month));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=monthly_stats.csv');

        fastcsv.write(csvData, { headers: true }).pipe(res);

    } catch (error) {
        console.error('Error generating monthly CSV:', error.message);
        res.status(500).json({ error: error.message });
    }
};