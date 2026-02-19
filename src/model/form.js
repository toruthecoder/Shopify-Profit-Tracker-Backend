import mongoose from "mongoose";
const formSchema = new mongoose.Schema({
    shop: String,
    month: String,
    paymentFees: Number,
    transactionFees: Number,
    packagingCosts: Number,
    deliveryCosts: Number,
    appCosts: Number,
    shopifyCosts: Number,
    marketingCosts: Number,
}, { timestamps: true })

const MontlyCosts = mongoose.model('MontlyCosts', formSchema)
export default MontlyCosts; 