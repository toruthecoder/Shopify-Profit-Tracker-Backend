import mongoose from 'mongoose'

const refundSchema = new mongoose.Schema({
    shop: { type: String, required: true, index: true },
    refundId: { type: Number, required: true },
    orderId: { type: Number, required: true, index: true },
    totalRefunded: { type: String },
    currency: { type: String },
    transactions: [
        {
            id: Number,
            amount: String,
            currency: String,
            kind: String,
            status: String,
            gateway: String,
            processed_at: Date
        }
    ],

    refundLineItems: [
        {
            lineItemId: Number,
            quantity: Number,
            subtotal: String,
            totalTax: String
        }
    ],

    createdAtShopify: {
        type: Date
    },
    rawData: { type: Object },
}, { timestamps: true })

const Refund = mongoose.model('Refund', refundSchema)
export default Refund