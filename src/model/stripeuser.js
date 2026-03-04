import mongoose from 'mongoose'

const stripeUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    plan: { type: String, default: 'none' },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    subscriptionStatus: String,
    trialStartDate: Date,
    trialEndDate: Date,
    createdAt: { type: Date, default: Date.now },
})

stripeUserSchema.virtual('isTrialActive').get(function () {
    if (!this.trialEndDate) return false
    const now = new Date()
    return now <= this.trialEndDate
})

stripeUserSchema.virtual('trialDaysRemaining').get(function () {
    if (!this.trialEndDate) return 0
    const now = new Date()
    const diff = this.trialEndDate - now
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
})

const User = mongoose.model('User', stripeUserSchema)
export default User