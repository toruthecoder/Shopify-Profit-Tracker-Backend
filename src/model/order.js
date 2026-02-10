import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
    shop: { type: String, required: true },
    orderId: { type: Number, required: true},
    email: String,
    totalPrice: String,
    currency: String,
    rawData: Object,
}, { timestamps: true })

const Order = mongoose.model('Order', orderSchema)
export default Order