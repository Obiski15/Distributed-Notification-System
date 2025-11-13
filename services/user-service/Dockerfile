# =========================
# Stage 1: Build Environment
# =========================
FROM php:8.3-cli-alpine AS builder

# Install build tools and system dependencies for PHP extensions
# The PHPIZE_DEPS variable contains essential build tools like make, g++, autoconf
RUN apk add --no-cache \
    git \
    curl \
    zip \
    unzip \
    # Dev packages needed for compiling extensions
    libpng-dev \
    libxml2-dev \
    postgresql-dev \
    openssl-dev \
    pcre-dev \
    $PHPIZE_DEPS

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql pcntl xml gd sockets

# Install Redis & Swoole extensions from PECL
RUN pecl install redis swoole \
    && docker-php-ext-enable redis swoole

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application files
COPY . .

# Install Composer dependencies and optimize for production
# This now works because the 'artisan' file has been copied
RUN composer install --no-dev --optimize-autoloader --prefer-dist --no-interaction

# Optimize Laravel for production
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# =========================
# Stage 2: Production Image
# =========================
FROM php:8.3-cli-alpine

# Install only RUNTIME dependencies
RUN apk add --no-cache \
    mysql-client \
    # Use postgresql-libs, not postgresql-dev, for runtime
    postgresql-libs

WORKDIR /var/www/html

# Copy compiled PHP extensions and their configs from the builder stage
COPY --from=builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/

# Copy Composer dependencies and application code from the builder stage
COPY --from=builder /var/www/html .

# Create a non-root user and group for the application
RUN addgroup -g 1001 -S www-data \
    && adduser -u 1001 -S www-data -G www-data

# Set correct permissions for storage and cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Switch to the non-root user
USER www-data

# Expose port for Octane
EXPOSE 8000

# Start Octane with Swoole
CMD ["php", "artisan", "octane:start", "--server=swoole", "--host=0.0.0.0", "--port=8000"]