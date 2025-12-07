import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"
import { SwaggerController } from "./swaggerController"
import { SwaggerGateway } from "./swaggerService"

@Module({
  imports: [HttpModule],
  providers: [SwaggerGateway],
  controllers: [SwaggerController],
  exports: [SwaggerGateway],
})
export class SwaggerModule {}
