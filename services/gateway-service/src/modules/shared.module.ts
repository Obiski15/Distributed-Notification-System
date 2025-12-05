import { HttpModule } from "@nestjs/axios"
import { Global, Module } from "@nestjs/common"
import { ConsulProvider } from "../providers/consul.provider"

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],

  providers: [ConsulProvider],
  exports: [ConsulProvider, HttpModule],
})
export class SharedModule {}
