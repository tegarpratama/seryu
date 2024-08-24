CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    driver_code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS driver_attendances (
    id SERIAL PRIMARY KEY,
    driver_code VARCHAR(255) REFERENCES drivers(driver_code),
    attendance_date DATE NOT NULL,
    attendance_status BOOLEAN NOT null,
    CONSTRAINT unique_attendance UNIQUE (driver_code, attendance_date)
);

CREATE TABLE IF NOT EXISTS shipments (
    shipment_no VARCHAR(255) PRIMARY KEY,
    shipment_date DATE NOT NULL,
    shipment_status VARCHAR(255) NOT NULL CHECK (shipment_status IN ('RUNNING', 'DONE', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS shipment_costs (
    id SERIAL PRIMARY KEY,
    driver_code VARCHAR(255) REFERENCES drivers(driver_code),
    shipment_no VARCHAR(255) REFERENCES shipments(shipment_no),
    total_costs DECIMAL(10, 2) NOT NULL,
    cost_status VARCHAR(255) NOT null CHECK (cost_status IN ('PENDING', 'CONFIRMED', 'PAID')),
    constraint unique_shipment_costs unique (driver_code,shipment_no)
);

CREATE TABLE IF NOT EXISTS variable_configs (
    key VARCHAR(255) PRIMARY KEY,
    value INTEGER
);

