-- MySQL initialization script
-- This creates multiple databases and users when MySQL container starts

-- TEMPLATE SERVICE
CREATE DATABASE IF NOT EXISTS template_service;
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED BY 'supersecretpassword';
GRANT ALL PRIVILEGES ON template_service.* TO 'user'@'%';

-- USER SERVICE
CREATE DATABASE IF NOT EXISTS user_service;
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED BY 'supersecretpassword';
GRANT ALL PRIVILEGES ON user_service.* TO 'user'@'%';

FLUSH PRIVILEGES;


USE template_service;
-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed data for email templates
INSERT INTO templates (name, subject, body) VALUES
('welcome_email', 'Welcome to the Family, {{name}}!', '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;"><div style="width: 90%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><h1 style="color: #333; margin-bottom: 20px;">Welcome, {{name}}!</h1><p style="color: #555; margin-bottom: 25px;">We''re so excited to have you on board. To get started and explore your new account, please click the button below.</p><a href="{{link}}" style="display: inline-block; padding: 12px 25px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a></div></body></html>'),
('password_reset', 'Reset Your Password', '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;"><div style="width: 90%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><h1 style="color: #333; margin-bottom: 20px;">Password Reset Request</h1><p style="color: #555; margin-bottom: 25px;">Hello {{name}}, we received a request to reset your password. If you made this request, click the button below. If not, please ignore this email.</p><a href="{{link}}" style="display: inline-block; padding: 12px 25px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a></div></body></html>'),
('order_confirmation', 'Your Order is Confirmed!', '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;"><div style="width: 90%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><h1 style="color: #333; margin-bottom: 20px;">Thanks for your order, {{name}}!</h1><p style="color: #555; margin-bottom: 25px;">We''ve received your order and are getting it ready. You can view your order details and status by clicking the button below.</p><a href="{{link}}" style="display: inline-block; padding: 12px 25px; background-color: #17a2b8; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">View Order Details</a></div></body></html>'),
('account_verification', 'Verify Your Account', '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;"><div style="width: 90%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><h1 style="color: #333; margin-bottom: 20px;">Almost there, {{name}}!</h1><p style="color: #555; margin-bottom: 25px;">Please verify your email address to complete your registration. Click the button below to activate your account.</p><a href="{{link}}" style="display: inline-block; padding: 12px 25px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Account</a></div></body></html>'),
('subscription_renewal', 'Your Subscription is Renewing Soon', '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;"><div style="width: 90%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><h1 style="color: #333; margin-bottom: 20px;">Subscription Renewal</h1><p style="color: #555; margin-bottom: 25px;">Hi {{name}}, this is a reminder that your subscription will renew soon. You can manage your subscription settings by clicking the button below.</p><a href="{{link}}" style="display: inline-block; padding: 12px 25px; background-color: #ffc107; color: #333; text-decoration: none; border-radius: 5px; font-weight: bold;">Manage Subscription</a></div></body></html>'),
('newsletter', 'This Week''s Newsletter', '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;"><div style="width: 90%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><h1 style="color: #333; margin-bottom: 20px;">Our Latest News, {{name}}!</h1><p style="color: #555; margin-bottom: 25px;">Here''s what''s been happening this week. Click below to read our full newsletter and catch up on all the latest updates and stories.</p><a href="{{link}}" style="display: inline-block; padding: 12px 25px; background-color: #6c757d; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Read More</a></div></body></html>'),
('invoice', 'Your New Invoice is Ready', '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;"><div style="width: 90%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><h1 style="color: #333; margin-bottom: 20px;">New Invoice Available</h1><p style="color: #555; margin-bottom: 25px;">Hello {{name}}, your latest invoice is now available for review. You can view and download your invoice by clicking the button below.</p><a href="{{link}}" style="display: inline-block; padding: 12px 25px; background-color: #17a2b8; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">View Invoice</a></div></body></html>'),
('notification_alert', 'New Notification', '<html><body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;"><div style="width: 90%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"><h1 style="color: #333; margin-bottom: 20px;">You Have a New Alert!</h1><p style="color: #555; margin-bottom: 25px;">Hi {{name}}, you have a new notification. Click the button below to see the details.</p><a href="{{link}}" style="display: inline-block; padding: 12px 25px; background-color: #dc3545; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Check Notification</a></div></body></html>')
ON DUPLICATE KEY UPDATE
    subject = VALUES(subject),
    body = VALUES(body);

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
-- Seed users
INSERT INTO users (
    user_id,
    name,
    email,
    password,
    preferences,
    push_tokens
) VALUES
(
    UUID(),
    'John Doe',
    'john@example.com',
    '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghi',
    JSON_OBJECT(
        'push_notification_enabled', TRUE,
        'email_notification_enabled', TRUE
    ),
    JSON_ARRAY()
),
(
    UUID(),
    'Jane Smith',
    'jane@example.com',
    '$2y$10$zyxwvutsrqponmlkjihgf0987654321abcdabcd12',
    JSON_OBJECT(
        'push_notification_enabled', FALSE,
        'email_notification_enabled', TRUE
    ),
    JSON_ARRAY()
),
(
    UUID(),
    'Michael Brown',
    'mike@example.com',
    '$2y$10$qwertyuiopasdfghjklzxcvbnm1234567890test',
    JSON_OBJECT(
        'push_notification_enabled', TRUE,
        'email_notification_enabled', FALSE
    ),
    JSON_ARRAY('token123', 'token456')
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    password = VALUES(password),
    preferences = VALUES(preferences),
    push_tokens = VALUES(push_tokens);