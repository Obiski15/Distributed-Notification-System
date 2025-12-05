import logger from "./logger.js"

interface ShutdownHandler {
  cleanup: () => Promise<void>
  timeout?: number
}

export function setup_graceful_shutdown(handlers: ShutdownHandler[]): void {
  const graceful_shutdown = async (signal: string) => {
    logger.info(`\n🛑 Received ${signal}, shutting down gracefully...`)

    let shutdown_timeout: NodeJS.Timeout | undefined

    try {
      // Set a timeout for the entire shutdown process
      const max_shutdown_time = 30000 // 30 seconds
      const shutdown_promise = Promise.all(
        handlers.map(async handler => {
          const handler_timeout = handler.timeout || 10000 // Default 10s per handler
          return Promise.race([
            handler.cleanup(),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Handler timeout")),
                handler_timeout,
              ),
            ),
          ])
        }),
      )

      shutdown_timeout = setTimeout(() => {
        logger.error(
          `⚠️  Shutdown timeout exceeded (${max_shutdown_time}ms), forcing exit...`,
        )
        process.exit(1)
      }, max_shutdown_time)

      await shutdown_promise
      clearTimeout(shutdown_timeout)

      logger.info("✅ Graceful shutdown completed successfully")
      process.exit(0)
    } catch (error) {
      if (shutdown_timeout) clearTimeout(shutdown_timeout)
      logger.error(`❌ Error during graceful shutdown: ${error as Error}`)
      process.exit(1)
    }
  }

  // Register signal handlers
  process.on("SIGINT", () => {
    graceful_shutdown("SIGINT").catch(err => {
      logger.error(`Fatal error during SIGINT shutdown: ${err}`)
      process.exit(1)
    })
  })

  process.on("SIGTERM", () => {
    graceful_shutdown("SIGTERM").catch(err => {
      logger.error(`Fatal error during SIGTERM shutdown: ${err}`)
      process.exit(1)
    })
  })

  // Handle uncaught errors
  process.on("uncaughtException", err => {
    logger.error(`❌ Uncaught Exception: ${err}`)
    graceful_shutdown("UNCAUGHT_EXCEPTION").catch(() => process.exit(1))
  })

  process.on("unhandledRejection", (reason, _promise) => {
    logger.error(`❌ Unhandled Rejection - Reason: ${String(reason)}`)
    graceful_shutdown("UNHANDLED_REJECTION").catch(() => process.exit(1))
  })
}
