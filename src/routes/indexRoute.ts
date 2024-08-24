import { Router } from 'express'
import salaryRoute from './salaryRoute'

const router = Router()

router.use('/salary', salaryRoute)

export default router
