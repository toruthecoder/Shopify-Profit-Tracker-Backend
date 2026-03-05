import axios from "axios";
import Store from "../model/user.js";

export const createProduct = async (req, res) => {
    try {
        const store = await Store.findOne({ shop: process.env.SHOPIFY_SHOP });

        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }

        const { title, body_html, vendor, price } = req.body;

        const response = await axios.post(
            `https://${store.shop}/admin/api/2024-10/products.json`,
            {
                product: {
                    title,
                    body_html,
                    vendor,
                    variants: [
                        {
                            price
                        }
                    ]
                }
            },
            {
                headers: {
                    "X-Shopify-Access-Token": store.accessToken,
                    "Content-Type": "application/json"
                }
            }
        );

        res.status(201).json({
            success: true,
            product: response.data.product
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
};


export const updateProduct = async (req, res) => {
    try {
        const store = await Store.findOne({ shop: process.env.SHOPIFY_SHOP });

        const { id } = req.params;
        const { title, body_html, vendor } = req.body;

        const response = await axios.put(
            `https://${store.shop}/admin/api/2024-10/products/${id}.json`,
            {
                product: {
                    id,
                    title,
                    body_html,
                    vendor
                }
            },
            {
                headers: {
                    "X-Shopify-Access-Token": store.accessToken,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({
            success: true,
            product: response.data.product
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const store = await Store.findOne({ shop: process.env.SHOPIFY_SHOP });

        const { id } = req.params;

        await axios.delete(
            `https://${store.shop}/admin/api/2024-10/products/${id}.json`,
            {
                headers: {
                    "X-Shopify-Access-Token": store.accessToken
                }
            }
        );

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
};