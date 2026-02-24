import express from 'express'
import { fetchData } from '../contollers/fetchData.js'
import { handleMonthlyCsv } from '../contollers/monthlyCsv.js'

const router = express.Router()

router.get('/', fetchData)
router.get('/csv', handleMonthlyCsv)

export default router