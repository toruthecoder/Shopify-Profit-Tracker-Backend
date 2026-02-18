import express from 'express'
import { handleSyncOrders, handleSyncProducts } from '../contollers/syncProducts.js'

const router = express.Router()

router.get('/orders', handleSyncOrders)
router.get('/products', handleSyncProducts)

export default router
