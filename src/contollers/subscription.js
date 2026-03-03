import Stripe from 'stripe'
import User from '../model/stripeuser.js'

const PLANS = {
    starter: { name: 'Starter Plan', amount: 1500, interval: 'month' },
    pro: { name: 'Pro Plan', amount: 2900, interval: 'month' }
}

export const startFreeTrial = async (req, res) => {
    try {
        const { email, shop } = req.body
        if (!email) return res.status(400).json({ error: 'Email is required' })

        // findOneAndUpdate with upsert avoids duplicate creation (race condition safe)
        const user = await User.findOneAndUpdate(
            { email },
            { $setOnInsert: { email, shop: shop || '', plan: 'trial', trialStartDate: new Date() } },
            { upsert: true, new: true }
        )

        console.log('Free trial user:', user.email, '| plan:', user.plan)

        return res.json({
            message: 'Free trial active',
            plan: user.plan,
            isTrialActive: user.isTrialActive,
            trialDaysRemaining: user.trialDaysRemaining,
        })
    } catch (error) {
        console.error('Free trial error:', error)
        return res.status(500).json({ error: error.message })
    }
}

export const getPlanStatus = async (req, res) => {
    try {
        const { email } = req.query
        if (!email) return res.status(400).json({ error: 'Email is required' })

        const user = await User.findOne({ email })

        if (!user) {
            // Not in DB — this shouldn't happen normally but handle gracefully
            return res.json({
                plan: 'none',
                isTrialActive: false,
                trialDaysRemaining: 0,
                subscriptionStatus: null,
                canExportCSV: false,
                canInputCosts: false,
                isViewOnly: true,
            })
        }

        // Auto-expire trial if time is up
        if (user.plan === 'trial' && !user.isTrialActive) {
            user.plan = 'expired'
            await user.save()
        }

        return res.json({
            plan: user.plan,
            isTrialActive: user.isTrialActive,
            trialDaysRemaining: user.trialDaysRemaining,
            subscriptionStatus: user.subscriptionStatus || null,
            canExportCSV: ['starter', 'pro'].includes(user.plan) || user.isTrialActive,
            canInputCosts: ['starter', 'pro'].includes(user.plan) || user.isTrialActive,
            isViewOnly: user.plan === 'expired' || user.plan === 'none',
        })
    } catch (error) {
        console.error('Plan status error:', error)
        return res.status(500).json({ error: error.message })
    }
}

export const createCheckoutSession = async (req, res) => {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        const { plan, email } = req.body

        if (!plan || !PLANS[plan]) return res.status(400).json({ error: 'Invalid plan selected' })
        if (!email) return res.status(400).json({ error: 'Email is required' })

        const selectedPlan = PLANS[plan]

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email,
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: selectedPlan.name },
                    unit_amount: selectedPlan.amount,
                    recurring: { interval: selectedPlan.interval },
                },
                quantity: 1,
            }],
            // Pass plan + email so webhook knows what to save
            metadata: { plan, email },
            success_url: `${process.env.FRONTEND_URL}/subscription?success=true&plan=${plan}`,
            cancel_url: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
        })

        console.log('Checkout session created for:', email, '| plan:', plan)
        return res.json({ url: session.url })
    } catch (error) {
        console.error('Stripe checkout error:', error)
        return res.status(500).json({ error: error.message })
    }
}

export const stripeWebhook = async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sig = req.headers['stripe-signature']
    let event

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        console.error('Webhook signature error:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    try {
        switch (event.type) {

            case 'checkout.session.completed': {
                const session = event.data.object
                const { plan, email } = session.metadata

                if (email && plan) {
                    const updated = await User.findOneAndUpdate(
                        { email },
                        {
                            plan,
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            subscriptionStatus: 'active',
                        },
                        { upsert: true, new: true }
                    )
                    console.log(`Webhook: plan upgraded to '${plan}' for ${email}`, updated._id)
                }
                break
            }

            // Subscription canceled
            case 'customer.subscription.deleted': {
                const subscription = event.data.object
                await User.findOneAndUpdate(
                    { stripeSubscriptionId: subscription.id },
                    { plan: 'expired', subscriptionStatus: 'canceled' }
                )
                console.log('Webhook: subscription canceled:', subscription.id)
                break
            }

            // Payment failed
            case 'invoice.payment_failed': {
                const invoice = event.data.object
                await User.findOneAndUpdate(
                    { stripeCustomerId: invoice.customer },
                    { subscriptionStatus: 'past_due' }
                )
                console.log('Webhook: payment failed for:', invoice.customer)
                break
            }

            default:
                break
        }
    } catch (err) {
        console.error('Webhook handler error:', err)
        return res.status(500).json({ error: err.message })
    }

    return res.json({ received: true })
}