<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ConsulService
{
    protected static $serviceName;
    protected static $serviceId;
    protected static $serviceAddress;
    protected static $servicePort;


    protected static function init(): void
    {
        self::$serviceName = env('SERVICE_NAME');
        self::$servicePort = env('SERVICE_PORT');
        self::$serviceId = self::$serviceName . '-' . self::$servicePort;
        self::$serviceAddress = '0.0.0.0'; 
    }

    
    public static function register(): void
    {
        self::init();

        $consulHost = env('CONSUL_HOST');
        $consulPort = env('CONSUL_PORT');

        $payload = [
            'ID' => self::$serviceId,
            'Name' => self::$serviceName,
            'Address' => self::$serviceAddress,
            'Port' => (int) self::$servicePort,
            'Check' => [
                'HTTP' => "http://" . self::$serviceAddress . ":" . self::$servicePort . "/health",
                'Interval' => '10s',
                'Timeout' => '5s',
            ],
        ];

        try {
            Http::put("{$consulHost}:{$consulPort}/v1/agent/service/register", $payload);
            Log::info("✅ Registered ".self::$serviceName." with Consul successfully");
        } catch (\Exception $e) {
            Log::error("❌ Failed to register service with Consul: " . $e->getMessage());
        }
    }

    public static function deregister(): void
    {
        self::init();

        $consulHost = env('CONSUL_HOST');
        $consulPort = env('CONSUL_PORT');

        try {
            Http::put("{$consulHost}:{$consulPort}/v1/agent/service/deregister/" . self::$serviceId);
            Log::info("🧹 Deregistered ".self::$serviceId." from Consul");
        } catch (\Exception $e) {
            Log::error("⚠️ Failed to deregister service: " . $e->getMessage());
        }
    }

    public static function handleShutdown(): void
    {
        if (function_exists('pcntl_async_signals')) {
            pcntl_async_signals(true);

            pcntl_signal(SIGINT, function () {
                Log::info("🛑 SIGINT received, shutting down...");
                self::deregister();
                exit(0);
            });

            pcntl_signal(SIGTERM, function () {
                Log::info("🛑 SIGTERM received, shutting down...");
                self::deregister();
                exit(0);
            });
        }

        register_shutdown_function(function () {
            self::deregister();
        });
    }
}
