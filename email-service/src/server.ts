import app from "./app.js";
import { consumeQueue } from "./queue/rabbitmq.js";
import sendMail from "./utils/sendMail.js";

const start = async () => {
  try {
    await app.listen({ port: app.config.PORT });
    await consumeQueue("email", sendMail);
    console.log(`Email service listening on port ${app.config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
