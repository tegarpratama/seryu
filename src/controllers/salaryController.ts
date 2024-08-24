import { Request, Response } from 'express'
import { getDriverList } from '../models/salaryModel'

export const driverSalary = async (req: Request, res: Response) => {
  try {
    const {
      month,
      year,
      page_size = 10,
      current = 1,
      driver_code,
      status,
      name,
    } = req.query

    const result = await getDriverList({
      month: Number(month),
      year: Number(year),
      page_size: Number(page_size),
      current: Number(current),
      driver_code: driver_code as string,
      status: status as string,
      name: name as string,
    })

    res.json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
