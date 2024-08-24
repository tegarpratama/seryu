import { Router, Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { driverSalary } from '../controllers/salaryController'

const router = Router()

const validateQuery = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query)
    if (error) {
      return res.status(400).json({
        status: 'failed',
        message: 'Field ' + error.details[0].message,
      })
    }
    next()
  }
}

const listSchema = Joi.object({
  month: Joi.number().required(),
  year: Joi.number().required(),
  current: Joi.number().allow(null),
  page_size: Joi.number().allow(null),
  driver_code: Joi.string().allow(null),
  name: Joi.string().allow(null),
  status: Joi.string().allow(null),
})

router.get('/driver/list', validateQuery(listSchema), driverSalary)

export default router
