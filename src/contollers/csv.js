import fastcsv from 'fast-csv'
import Order from '../model/order.js'
import Product from '../model/prodcut.js'

export const handleOrderCsv = async (req, res) => {
    try {

        const shop = req.query.shop || process.env.SHOPIFY_SHOP;
        const orderData = await Order.find({ shop });
        const csvData = orderData.map(item => {
            const cost = Number(item?.totalPrice || 0);
            const discount = Number(item?.rawData?.total_discounts || 0);
            const refund = Number(
                item?.rawData?.total_cash_rounding_refund_adjustment_set?.presentment_money?.amount || 0
            );

            const revenue = cost - discount - refund;
            const totalCost = cost;
            const profit = revenue - totalCost;

            return {
                orderId: item.orderId,
                date: new Date(item?.rawData?.updated_at).toISOString().split("T")[0],
                revenue,
                totalCost,
                profit,
                status: item.status || item.rawData?.financial_status || 'unknown'
            };
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=orders.csv");

        fastcsv
            .write(csvData, { headers: true })
            .pipe(res);

    } catch (error) {
        console.error('Error in CSV: ', error?.response?.data || error.message)
        res.status(500).json({ error: error.message })
    }
}


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