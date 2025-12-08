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

USE user_service;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    preferences JSON NOT NULL DEFAULT (
        JSON_OBJECT(
            'push_notification_enabled', FALSE,
            'email_notification_enabled', FALSE
        )
    ),
    push_tokens JSON NOT NULL DEFAULT (JSON_ARRAY()),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);