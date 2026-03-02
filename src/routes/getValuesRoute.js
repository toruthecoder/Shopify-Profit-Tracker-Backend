import express from 'express'
import { handleSyncOrders, handleSyncProducts, getSingleOrder } from '../contollers/syncProducts.js'
import { handleOrderCsv, handleProductCsv } from '../contollers/csv.js'
const router = express.Router()

router.get('/orders', handleSyncOrders)
router.get('/orders/:id', getSingleOrder)
router.get('/orders/csv', handleOrderCsv);
router.get('/products', handleSyncProducts)
router.get('/products/csv', handleProductCsv)

export default router
