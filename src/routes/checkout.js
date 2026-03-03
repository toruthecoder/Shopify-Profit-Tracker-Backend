import express from 'express'
import {
    createCheckoutSession,
    stripeWebhook,
    startFreeTrial,
    getPlanStatus,
} from '../contollers/subscription.js'

const router = express.Router()

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

router.post('/checkout', express.json(), createCheckoutSession)
router.post('/free-trial', express.json(), startFreeTrial)
router.get('/plan-status', getPlanStatus)

export default router