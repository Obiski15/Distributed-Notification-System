import pino from "pino"
import pretty from "pino-pretty"

const logger = pino(
  pretty({
    messageFormat: "{msg}",
    colorize: true,
    ignore: "pid,hostname,time",
  }),
)

export default logger
