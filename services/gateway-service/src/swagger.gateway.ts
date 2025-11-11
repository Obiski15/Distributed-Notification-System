import { INestApplication, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import merge from 'lodash.merge';
import { FastifyInstance } from 'fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

interface MicroserviceSpec {
  name: string;
  url: string;
}

const MICROSERVICES: MicroserviceSpec[] = [
  { name: 'Email', url: 'http://email-service:3001/docs/json' },
  { name: 'Push', url: 'http://push-service:3002/docs/json' },
  { name: 'Template', url: 'http://template-service:3003/docs/json' },
  { name: 'User', url: 'http://user-service:8000/api-docs/openapi.json' },
];

@Injectable()
export class SwaggerGateway {
  constructor(private readonly httpService: HttpService) {}

  async setup(app: INestApplication) {
    // Get Fastify instance
    const fastifyApp = app.getHttpAdapter().getInstance() as FastifyInstance;

    // Endpoint to serve merged OpenAPI JSON
    fastifyApp.get('/swagger/api-docs', async (request, reply) => {
      try {
        const specs = await Promise.all(
          MICROSERVICES.map(async (svc) => {
            try {
              const response = await lastValueFrom(this.httpService.get(svc.url));
              return response.data;
            } catch (err) {
              console.warn(`Failed to fetch ${svc.name} spec:`, err.message);
              return {};
            }
          }),
        );

        const mergedSpec = specs.reduce(
          (acc, spec) => merge(acc, spec),
          {
            openapi: '3.0.3',
            info: {
              title: 'Unified API Gateway',
              version: '1.0.0',
              description: 'Aggregated API documentation for all microservices',
            },
            paths: {},
            components: {},
          },
        );

        reply.send(mergedSpec);
      } catch (err) {
        reply.status(500).send({ error: 'Failed to merge specs' });
      }
    });

    // Serve Swagger UI via NestJS + Fastify
    const config = new DocumentBuilder()
      .setTitle('Unified API Gateway')
      .setDescription('Aggregated API documentation for all microservices')
      .setVersion('1.0.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('swagger', app, document, {
      swaggerOptions: {
        url: '/swagger/api-docs.json',
        explorer: true,
      },
    });
  }
}
