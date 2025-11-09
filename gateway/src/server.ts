import app from "./app.js";

const start = async () => {
  try {
    await app.ready();

    await app.listen({ port: app.config.PORT });
    console.log(`Gateway listening on port ${app.config.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
