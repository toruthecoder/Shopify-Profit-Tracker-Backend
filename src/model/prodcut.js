import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    admin_graphql_api_id: String,
    title: { type: String, required: true },
    handle: { type: String, unique: true },
    body_html: String,
    vendor: String,
    product_type: String,
    status: { type: String, enum: ['active', 'draft', 'archived'] },
    tags: [String],

    // Embedded Variants
    variants: [{
        id: Number,
        title: String,
        price: mongoose.Decimal128,
        compare_at_price: mongoose.Decimal128,
        sku: String,
        inventory_quantity: Number,
        option1: String,
        taxable: Boolean,
        updated_at: Date
    }],

    variant_gids: [{
        admin_graphql_api_id: String,
        updated_at: Date
    }],

    updated_at: { type: Date, default: Date.now }
}, { _id: false });
const Product = mongoose.model('Product', ProductSchema)
export default Product