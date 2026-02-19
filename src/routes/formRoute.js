import express from 'express'
import { saveFormData, getFormData } from '../contollers/formData.js'
const router = express.Router()

router.get('/data', getFormData)
router.post('/data', saveFormData)

export default router