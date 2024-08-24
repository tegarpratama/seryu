import pool from '../configs/db'

interface QueryParams {
  month: number
  year: number
  page_size: number
  current: number
  driver_code?: string
  status?: string
  name?: string
}

export async function getDriverList({
  month,
  year,
  page_size,
  current,
  driver_code,
  status,
  name,
}: QueryParams) {
  let countQuery = `
    SELECT COUNT(*) AS total_count
    FROM (
      SELECT d.driver_code, d.name
      FROM drivers d
      LEFT JOIN driver_attendances sa ON d.driver_code = sa.driver_code
      LEFT JOIN shipment_costs sc ON d.driver_code = sc.driver_code
      LEFT JOIN shipments s ON s.shipment_no = sc.shipment_no AND s.shipment_status != 'CANCELED'
      LEFT JOIN variable_configs vc ON vc.key = 'DRIVER_MONTHLY_ATTENDANCE_SALARY'
      WHERE EXTRACT(MONTH FROM s.shipment_date) = $1
        AND EXTRACT(YEAR FROM s.shipment_date) = $2
      GROUP BY d.driver_code, d.name
    ) AS subquery
  `

  let dataQuery = `
    WITH driver_salaries AS (
      SELECT d.driver_code, d.name,
        COALESCE(SUM(CASE WHEN sc.cost_status = 'PENDING' THEN sc.total_costs ELSE 0 END), 0) AS total_pending,
        COALESCE(SUM(CASE WHEN sc.cost_status = 'CONFIRMED' THEN sc.total_costs ELSE 0 END), 0) AS total_confirmed,
        COALESCE(SUM(CASE WHEN sc.cost_status = 'PAID' THEN sc.total_costs ELSE 0 END), 0) AS total_paid,
        COALESCE(COUNT(sa.id) * vc.value, 0) AS total_attendance_salary,
        COALESCE(SUM(CASE WHEN sc.cost_status IN ('PENDING', 'CONFIRMED', 'PAID') THEN sc.total_costs ELSE 0 END), 0) + COALESCE(COUNT(sa.id) * vc.value, 0) AS total_salary,
        COALESCE(COUNT(DISTINCT s.shipment_no), 0) AS count_shipment
      FROM drivers d
      LEFT JOIN driver_attendances sa ON d.driver_code = sa.driver_code
      LEFT JOIN shipment_costs sc ON d.driver_code = sc.driver_code
      LEFT JOIN shipments s ON s.shipment_no = sc.shipment_no AND s.shipment_status != 'CANCELED'
      LEFT JOIN variable_configs vc ON vc.key = 'DRIVER_MONTHLY_ATTENDANCE_SALARY'
      WHERE EXTRACT(MONTH FROM s.shipment_date) = $1
        AND EXTRACT(YEAR FROM s.shipment_date) = $2
      GROUP BY d.driver_code, d.name, vc.value
    )
    SELECT * FROM driver_salaries
  `

  const totalDataParams: any[] = [month, year]
  const dataParams: any[] = [month, year]
  let chainCondition = false

  // Set condition params
  if (driver_code || name) {
    countQuery += ` WHERE `
    dataQuery += ` WHERE `

    if (driver_code) {
      countQuery += `subquery.driver_code = $${totalDataParams.length + 1}`
      dataQuery += `driver_salaries.driver_code = $${dataParams.length + 1}`

      totalDataParams.push(driver_code)
      dataParams.push(driver_code)
      chainCondition = true
    }

    if (name) {
      if (chainCondition) {
        countQuery += ` AND `
        dataQuery += ` AND `
      }

      countQuery += `subquery.name ILIKE $${totalDataParams.length + 1}`
      dataQuery += `driver_salaries.name ILIKE $${dataParams.length + 1}`

      totalDataParams.push(`%${name}%`)
      dataParams.push(`%${name}%`)
      chainCondition = true
    }
  }

  if (status) {
    if (chainCondition) {
      dataQuery += ` AND `
    }

    if (status === 'PENDING') {
      dataQuery += `total_pending > 0`
    } else if (status === 'CONFIRMED') {
      dataQuery += `total_confirmed > 0`
    } else {
      dataQuery += `total_paid > 0 AND total_confirmed = 0 AND total_pending = 0`
    }
  }

  dataQuery += ` ORDER BY driver_salaries.driver_code
  LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`
  dataParams.push(Number(page_size), (Number(current) - 1) * Number(page_size))

  const countResult = await pool.query(countQuery, totalDataParams)
  const dataResult = await pool.query(dataQuery, dataParams)

  return {
    data: dataResult.rows,
    total_row: parseInt(countResult.rows[0].total_count, 10),
    current: Number(current),
    page_size: Number(page_size),
  }
}
