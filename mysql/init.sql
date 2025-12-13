-- MySQL initialization script
-- This creates multiple databases when MySQL container starts

-- TEMPLATE SERVICE
CREATE DATABASE IF NOT EXISTS template_service;
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED BY 'supersecretpassword';
GRANT ALL PRIVILEGES ON template_service.* TO 'user'@'%';

-- USER SERVICE
CREATE DATABASE IF NOT EXISTS user_service;
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED BY 'supersecretpassword';
GRANT ALL PRIVILEGES ON user_service.* TO 'user'@'%';

FLUSH PRIVILEGES;