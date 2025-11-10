import { Provider } from '@nestjs/common';
import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';
dotenv.config();

export const RabbitMQProvider: Provider = {
  provide: 'RABBITMQ_CONNECTION',
  useFactory: async () => {
    const url = process.env.RABBITMQ_URL;
    if (!url) throw new Error('RABBITMQ_URL not set in env');

    const conn = await amqp.connect(url);
    const channel = await conn.createChannel();

    const exchange = process.env.RABBITMQ_EXCHANGE || 'notifications.direct';
    const emailQueue = process.env.EMAIL_QUEUE || 'email.queue';
    const pushQueue = process.env.PUSH_QUEUE || 'push.queue';
    const failedQueue = process.env.FAILED_QUEUE || 'failed.queue';

    await channel.assertExchange(exchange, 'direct', { durable: true });

    await channel.assertQueue(emailQueue, { durable: true });
    await channel.assertQueue(pushQueue, { durable: true });
    await channel.assertQueue(failedQueue, { durable: true });

    await channel.bindQueue(emailQueue, exchange, 'email');
    await channel.bindQueue(pushQueue, exchange, 'push');
    await channel.bindQueue(failedQueue, exchange, 'failed');

    // optional prefetch
    await channel.prefetch(10);

    return { channel, exchange };
  },
};
