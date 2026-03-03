import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    shop: { type: String, default: '' },
    plan: { type: String, default: 'trial' }, // 'trial' | 'starter' | 'pro' | 'expired'
    trialStartDate: { type: Date, default: Date.now },
    trialDays: { type: Number, default: 7 },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: { type: String },
}, { timestamps: true })

userSchema.virtual('isTrialActive').get(function () {
    if (this.plan !== 'trial') return false
    const now = new Date()
    const trialEnd = new Date(this.trialStartDate)
    trialEnd.setDate(trialEnd.getDate() + this.trialDays)
    return now < trialEnd
})

userSchema.virtual('trialDaysRemaining').get(function () {
    if (this.plan !== 'trial') return 0
    const now = new Date()
    const trialEnd = new Date(this.trialStartDate)
    trialEnd.setDate(trialEnd.getDate() + this.trialDays)
    const diff = trialEnd - now
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

userSchema.set('toJSON', { virtuals: true })
userSchema.set('toObject', { virtuals: true })

const User = mongoose.model('StripeUser', userSchema)
export default User