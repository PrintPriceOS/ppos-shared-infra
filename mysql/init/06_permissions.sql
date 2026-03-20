-- Grant all privileges to ppos_user from any host
-- This is necessary in Docker bridge networks where the client IP may vary
GRANT ALL PRIVILEGES ON printprice_os.* TO 'ppos_user'@'%';
FLUSH PRIVILEGES;
