import express from 'express'
import { getOrders, getRefunds, getProducts } from '../contollers/setValues.js'

const router = express.Router()

router.post('/orders', getOrders)
router.post('/returns', getRefunds)
router.post('/products', getProducts)

export default router