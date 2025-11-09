import amqplib from "amqplib";
import app from "../app.js";

let connection: amqplib.ChannelModel | null = null;
let channel: amqplib.Channel | null = null;

export const getChannel = async () => {
  if (!connection) {
    connection = await amqplib.connect(app.config.RABBITMQ_CONNECTION_URL);

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      connection = null;
      channel = null;
    });

    connection.on("close", () => {
      console.log("RabbitMQ connection closed");
      connection = null;
      channel = null;
    });
  }

  if (!channel) {
    channel = await connection.createChannel();
  }

  return channel;
};

export const consumeQueue = async <T>(
  routingKey: "email" | "push",
  callback: (data: T) => Promise<void>
) => {
  const ch = await getChannel();
  ch.assertExchange("notifications.direct", "direct", { durable: true });
  await ch.assertQueue(`${routingKey}.queue`, {
    durable: true,
    autoDelete: false,
  });
  await ch.bindQueue(`${routingKey}.queue`, "notifications.direct", routingKey);

  ch.consume(routingKey, async (msg: any) => {
    if (msg) {
      try {
        const data = JSON.parse(msg.content.toString());
        // todo: fetch template here and insert data into it,
        // todo: use circuit breaker pattern,
        await callback(data);
        // todo: store result in redis
        ch.ack(msg);
      } catch (error) {
        console.error("Error processing message:", error);
        ch.nack(msg, false, false); // Don't requeue failed messages
      }
    }
  });
};
