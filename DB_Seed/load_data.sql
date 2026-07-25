-- =====================================================
-- ONDE BULK DATA LOADING SQL SCRIPT
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

LOAD DATA INFILE '/tmp/DB_Seed/members.csv'
REPLACE INTO TABLE members
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(id, email, name, provider_id, password, phone_number, role, status, provider, created_at, updated_at);

LOAD DATA INFILE '/tmp/DB_Seed/seller_accounts.csv'
REPLACE INTO TABLE seller_accounts
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(id, member_id, bank_name, business_name, contact_phone, business_address, account_holder, account_number, business_number, representative_name, opened_at, status, created_at, @updated_at);

LOAD DATA INFILE '/tmp/DB_Seed/flight_routes.csv'
REPLACE INTO TABLE flight_routes
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/flight_schedules.csv'
REPLACE INTO TABLE flight_schedules
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/seat_inventories.csv'
REPLACE INTO TABLE seat_inventories
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/accommodation.csv'
REPLACE INTO TABLE accommodations
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(id, seller_id, name, description, category, location, business_license, approval_status, thumbnail_url, submit_date, created_at, updated_at);

LOAD DATA INFILE '/tmp/DB_Seed/rooms.csv'
REPLACE INTO TABLE rooms
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/rental_cars.csv'
REPLACE INTO TABLE rental_cars
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(id, seller_id, model_name, license_plate, car_type, approval_status, created_at, updated_at, location);

LOAD DATA INFILE '/tmp/DB_Seed/inventory.csv'
REPLACE INTO TABLE inventory
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/properties.csv'
REPLACE INTO TABLE properties
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/insurance_products.csv'
REPLACE INTO TABLE insurance_products
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/reservations.csv'
REPLACE INTO TABLE reservations
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/payments.csv'
REPLACE INTO TABLE payments
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/mileage_logs.csv'
REPLACE INTO TABLE mileage_logs
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/settlements.csv'
REPLACE INTO TABLE settlements
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/posts.csv'
REPLACE INTO TABLE posts
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

LOAD DATA INFILE '/tmp/DB_Seed/post_images.csv'
REPLACE INTO TABLE post_images
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS;

-- Local screenshot fallback: seed thumbnails are relative MinIO keys,
-- but the clone has no object files. Point to public demo images instead.
UPDATE accommodations
SET thumbnail_url = ELT(
  (id % 6) + 1,
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80'
);

UPDATE rental_cars
SET thumbnail_url = ELT(
  (id % 6) + 1,
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=800&q=80'
);

SET FOREIGN_KEY_CHECKS = 1;
