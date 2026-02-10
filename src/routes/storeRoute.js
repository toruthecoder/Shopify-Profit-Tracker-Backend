import express from 'express'
import { getAccess } from '../config/getAccess.js'

const router = express.Router();

router.get('/', getAccess)

export default router