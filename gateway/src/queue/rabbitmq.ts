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

export const publishQueue = async <T>(
  routingKey: "email" | "push",
  data: T
) => {
  const ch = await getChannel();
  const exchange = "notification.direct";

  ch.assertExchange(exchange, "direct", {
    durable: true,
    autoDelete: false,
  });

  ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)));
};
