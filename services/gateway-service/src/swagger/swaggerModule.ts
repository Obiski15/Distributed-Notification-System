import { Module } from "@nestjs/common"
import { HttpModule } from "@nestjs/axios"
import { ConsulModule } from "../consul/consul.module"
import { SwaggerGateway } from "./swaggerService"
import { SwaggerController } from "./swaggerController"

@Module({
  imports: [HttpModule, ConsulModule],
  providers: [SwaggerGateway],
  controllers: [SwaggerController],
})
export class SwaggerModule {}
