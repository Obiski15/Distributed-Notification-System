<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\ConsulService;

class AppServiceProvider extends ServiceProvider
{

    public function register(): void
    {
        // 
    }

    public function boot(): void
    {
        // Register this service with Consul
        ConsulService::register();

        app()->terminating(function () {
            ConsulService::deregister();
        });
    }
}
