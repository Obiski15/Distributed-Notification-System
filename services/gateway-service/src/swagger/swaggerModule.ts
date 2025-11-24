import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"

@Module({
  imports: [HttpModule],
  providers: [],
  controllers: [],
})
export class SwaggerModule {}
