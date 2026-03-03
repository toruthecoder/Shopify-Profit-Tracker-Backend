import express from 'express'
import { handleSyncOrders, handleSyncProducts, getSingleOrder } from '../contollers/syncProducts.js'
import { handleOrderCsv, handleProductCsv } from '../contollers/csv.js'
import { getHotProducts } from '../contollers/hotProducts.js'
const router = express.Router()

router.get('/orders/csv', handleOrderCsv);
router.get('/orders', handleSyncOrders)
router.get('/orders/:id', getSingleOrder)
router.get('/products/csv', handleProductCsv)
router.get('/products/hot', getHotProducts);
router.get('/products', handleSyncProducts)


export default router
