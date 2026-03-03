import Order from '../model/order.js';
import Product from '../model/prodcut.js';

export const getHotProducts = async (req, res) => {
    try {
        const shop = req.query.shop || process.env.SHOPIFY_SHOP;
        const { days = 30 } = req.query;

        // Calculate date range
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Get orders from the specified period
        const orders = await Order.find({
            shop,
            $expr: {
                $gte: [
                    { $toDate: "$rawData.created_at" },
                    startDate
                ]
            }
        });

        // Create a map to track product sales
        const productSales = new Map();

        // Process each order
        orders.forEach(order => {
            const lineItems = order?.rawData?.line_items || [];

            lineItems.forEach(item => {
                const productId = item.product_id?.toString();
                const quantity = item.quantity || 1;
                const price = parseFloat(item.price) || 0;

                if (productId) {
                    if (productSales.has(productId)) {
                        const existing = productSales.get(productId);
                        existing.quantity += quantity;
                        existing.revenue += price * quantity;
                    } else {
                        productSales.set(productId, {
                            productId,
                            title: item.title,
                            quantity,
                            revenue: price * quantity,
                            sku: item.sku
                        });
                    }
                }
            });
        });

        // Convert to array and sort by quantity sold
        const sortedProducts = Array.from(productSales.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // Get full product details from database
        const hotProducts = await Promise.all(
            sortedProducts.map(async (soldItem) => {
                // Search by _id (which is the Shopify ID)
                const product = await Product.findOne({
                    shop,
                    _id: soldItem.productId
                });

                if (!product) {
                    console.log(`Product not found for ID: ${soldItem.productId}`);
                    // Return basic info from the order instead of null
                    return {
                        productId: soldItem.productId,
                        title: soldItem.title || 'Unknown Product',
                        handle: '',
                        image: null,
                        alt: null,
                        soldQuantity: soldItem.quantity,
                        revenue: soldItem.revenue,
                        variant: null,
                        productData: {
                            id: soldItem.productId,
                            title: soldItem.title || 'Unknown Product',
                            vendor: 'Unknown',
                            type: 'Unknown'
                        }
                    };
                }

                return {
                    productId: product._id,
                    title: product.title,
                    handle: product.handle,
                    image: product?.rawData?.image?.src,
                    alt: product?.rawData?.image?.alt,
                    soldQuantity: soldItem.quantity,
                    revenue: soldItem.revenue,
                    productData: {
                        id: product._id,
                        title: product.title,
                        vendor: product.vendor,
                        type: product.product_type
                    }
                };
            })
        );

        // Log the products being sent
        console.log('Hot products being sent:', hotProducts.map(p => ({
            id: p.productId,
            title: p.title,
            sold: p.soldQuantity
        })));

        res.json({
            success: true,
            period: `${days} days`,
            products: hotProducts
        });

    } catch (error) {
        console.error('Error fetching hot products:', error);
        res.status(500).json({ error: error.message });
    }
};