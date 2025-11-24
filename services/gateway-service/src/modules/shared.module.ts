import { HttpModule } from "@nestjs/axios"
import { Global, Logger, Module } from "@nestjs/common"
import { ConsulProvider } from "../providers/consul.provider"

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],

  providers: [ConsulProvider, Logger],
  exports: [ConsulProvider, Logger, HttpModule],
})
export class SharedModule {}
