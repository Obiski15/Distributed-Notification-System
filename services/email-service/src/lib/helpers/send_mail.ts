import type { SendMailOptions, Transporter } from "nodemailer"
import nodemailer from "nodemailer"

import { config } from "@shared/config/index.js"

let transporter: Transporter

function create_transporter(): Transporter {
  // eslint-disable-next-line
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  } as any)
}

function get_transporter(): Transporter {
  if (!transporter) {
    transporter = create_transporter()
  }
  return transporter
}

async function send_mail({
  from,
  to,
  html,
  subject,
  ...rest
}: SendMailOptions) {
  await get_transporter().sendMail({
    from,
    to,
    subject,
    html,
    ...rest,
  })
}

export default send_mail
