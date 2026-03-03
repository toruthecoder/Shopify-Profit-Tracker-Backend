import fastcsv from 'fast-csv'
import Order from '../model/order.js'
import Product from '../model/prodcut.js'

export const handleOrderCsv = async (req, res) => {
    try {
        const shop = req.query.shop || process.env.SHOPIFY_SHOP;
        const orderData = await Order.find({ shop });

        const csvData = orderData.map(item => {
            const cost = Number(item?.totalPrice) || 0;
            const discount = Number(item?.rawData?.total_discounts) || 0;
            const refund = Number(
                item?.rawData?.total_cash_rounding_refund_adjustment_set?.presentment_money?.amount
            ) || 0;

            const revenue = cost - discount - refund;
            const totalCost = cost;
            const profit = revenue - totalCost;

            let formattedDate = 'Unknown';
            const dateStr = item?.rawData?.updated_at || item?.updatedAt || item?.createdAt;

            if (dateStr) {
                try {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        formattedDate = date.toISOString().split("T")[0];
                    }
                } catch (e) {
                    console.warn('Invalid date for order:', item.orderId);
                }
            }

            return {
                orderId: item.orderId || item._id,
                date: formattedDate,
                revenue: Math.round(revenue * 100) / 100,
                totalCost: Math.round(totalCost * 100) / 100,
                profit: Math.round(profit * 100) / 100,
                status: item.status || item.rawData?.financial_status || 'unknown',
                email: item.email || '',
                currency: item.currency || 'USD'
            };
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.csv`);

        fastcsv
            .write(csvData, { headers: true })
            .pipe(res);

    } catch (error) {
        console.error('Error in CSV: ', error.message);
        res.status(500).json({ error: error.message });
    }
};


export const handleProductCsv = async (req, res) => {
    try {
        const shop = req.query.shop || process.env.SHOPIFY_SHOP;
        const productData = await Product.find({ shop })
        const csvData = productData.map(item => ({
            id: item._id,
            title: item.title,
            vendor: item.vendor,
            type: item.product_type,
            html: item?.rawData?.body_html,
            tags: item?.rawData?.tags,
            variants: JSON.stringify(item.variants.map(variant => ({
                variantTitle: variant.title,
                variantPrice: variant.price,
                variantQuantity: variant.inventory_quantity,
            }))),
            src: item?.rawData?.image?.src,
            alt: item?.rawData?.image?.alt,
        }));

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=products.csv");

        fastcsv
            .write(csvData, { headers: true })
            .pipe(res);
    } catch (error) {
        console.error('Error in CSV: ', error?.response?.data || error.message)
        res.status(500).json({ error: error.message })
    }
}