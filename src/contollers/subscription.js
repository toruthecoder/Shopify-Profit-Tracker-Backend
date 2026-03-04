import Stripe from 'stripe'
import dotenv from 'dotenv'
import User from '../model/stripeuser.js'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

const PLANS = {
    starter: { name: 'Starter Plan', amount: 1500, interval: 'month' },
    pro: { name: 'Pro Plan', amount: 2900, interval: 'month' },
}

export const startFreeTrial = async (req, res) => {
    try {
        const { email, shop } = req.body
        if (!email) return res.status(400).json({ error: 'Email required' })

        const trialDays = 7
        const now = new Date()
        const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)

        // Upsert ensures user is created if not exist
        const user = await User.findOneAndUpdate(
            { email },
            {
                $setOnInsert: {
                    email,
                    shop,
                    plan: 'trial',
                    trialStartDate: now,
                    trialEndDate: trialEnd,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        return res.json({
            plan: user.plan,
            trialStartDate: user.trialStartDate,
            trialEndDate: user.trialEndDate,
            isTrialActive: user.isTrialActive,
            trialDaysRemaining: user.trialDaysRemaining,
        })
    } catch (error) {
        console.error('Free trial error:', error)
        return res.status(500).json({ error: 'Server error' })
    }
}

export const getPlanStatus = async (req, res) => {
    try {
        const { email } = req.query
        if (!email) return res.status(400).json({ error: 'Email required' })

        const user = await User.findOne({ email })

        if (!user) {
            return res.json({
                plan: 'none',
                isTrialActive: false,
                trialStartDate: null,
                trialEndDate: null,
                trialDaysRemaining: 0,
                subscriptionStatus: null,
            })
        }

        // Expire trial automatically
        if (user.plan === 'trial' && !user.isTrialActive) {
            user.plan = 'expired'
            await user.save()
        }

        return res.json({
            plan: user.plan,
            isTrialActive: user.isTrialActive,
            trialStartDate: user.trialStartDate,
            trialEndDate: user.trialEndDate,
            trialDaysRemaining: user.trialDaysRemaining,
            subscriptionStatus: user.subscriptionStatus,
        })
    } catch (error) {
        console.error('Plan status error:', error)
        return res.status(500).json({ error: 'Server error' })
    }
}

export const createCheckoutSession = async (req, res) => {
    try {
        const { plan, email } = req.body
        if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' })
        if (!email) return res.status(400).json({ error: 'Email required' })

        const selectedPlan = PLANS[plan]

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: selectedPlan.name },
                        unit_amount: selectedPlan.amount,
                        recurring: { interval: selectedPlan.interval },
                    },
                    quantity: 1,
                },
            ],
            metadata: { plan, email },
            success_url: `${process.env.FRONTEND_URL}/subscription?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
        })

        return res.json({ url: session.url })
    } catch (error) {
        console.error('Checkout session error:', error)
        return res.status(500).json({ error: 'Stripe checkout failed' })
    }
}

export const cancelSubscription = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })
        if (!user || !user.stripeSubscriptionId) {
            return res.status(404).json({ error: 'No active subscription found' })
        }

        // Cancel at period end
        await stripe.subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true })

        user.subscriptionStatus = 'canceled'
        await user.save()

        return res.json({ message: 'Subscription canceled. Trial continues if active.' })
    } catch (err) {
        console.error('Cancel subscription error:', err)
        return res.status(500).json({ error: 'Failed to cancel subscription' })
    }
}

export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
        console.error('Webhook signature failed:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object
                const { email, plan } = session.metadata

                const user = await User.findOne({ email })
                const now = new Date()
                let trialStart = user?.trialStartDate || now
                let trialEnd = user?.trialEndDate

                // If user upgrades during trial, extend trial to 30 days
                if (user?.plan === 'trial' && user?.isTrialActive) {
                    trialEnd = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000)
                }

                await User.findOneAndUpdate(
                    { email },
                    {
                        plan,
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription,
                        subscriptionStatus: 'active',
                        trialStartDate: trialStart,
                        trialEndDate: trialEnd,
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                )

                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object
                await User.findOneAndUpdate(
                    { stripeSubscriptionId: subscription.id },
                    { plan: 'expired', subscriptionStatus: 'canceled' }
                )
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object
                await User.findOneAndUpdate(
                    { stripeCustomerId: invoice.customer },
                    { subscriptionStatus: 'past_due' }
                )
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return res.json({ received: true })
    } catch (err) {
        console.error('Webhook handler error:', err)
        return res.status(500).json({ error: 'Webhook handler failed' })
    }
}