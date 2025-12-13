import logger from "@dns/shared/utils/logger"
import { TemplateDataSource } from "../config/datasource"
import { db_destroy, db_init } from "../config/db"
import { Template, TemplateType } from "../entities/template-entity"

const wrapEmail = (
  title: string,
  content: string,
  ctaLink: string,
  ctaText: string,
) =>
  `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <style>
    body { background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    .container { display: block; margin: 0 auto !important; max-width: 580px; padding: 10px; width: 580px; }
    .content { box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px; }
    .main { background: #ffffff; border-radius: 3px; width: 100%; }
    .wrapper { box-sizing: border-box; padding: 20px; }
    .btn { box-sizing: border-box; width: 100%; }
    .btn > tbody > tr > td { padding-bottom: 15px; }
    .btn table { width: auto; }
    .btn table td { background-color: #ffffff; border-radius: 5px; text-align: center; }
    .btn a { background-color: #3498db; border: solid 1px #3498db; border-radius: 5px; box-sizing: border-box; color: #ffffff; cursor: pointer; display: inline-block; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-decoration: none; text-transform: capitalize; }
    .footer { clear: both; margin-top: 10px; text-align: center; width: 100%; }
    .footer td, .footer p, .footer span, .footer a { color: #999999; font-size: 12px; text-align: center; }
    h1, h2, h3 { color: #000000; font-family: sans-serif; font-weight: 400; line-height: 1.4; margin: 0; margin-bottom: 30px; }
    p, ul, ol { font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px; }
    @media only screen and (max-width: 620px) {
      table[class=body] h1 { font-size: 28px !important; margin-bottom: 10px !important; }
      table[class=body] p, table[class=body] ul, table[class=body] ol, table[class=body] td, table[class=body] span, table[class=body] a { font-size: 16px !important; }
      table[class=body] .wrapper, table[class=body] .article { padding: 10px !important; }
      table[class=body] .content { padding: 0 !important; }
      table[class=body] .container { padding: 0 !important; width: 100% !important; }
    }
  </style>
</head>
<body class="">
  <table border="0" cellpadding="0" cellspacing="0" class="body">
    <tr>
      <td>&nbsp;</td>
      <td class="container">
        <div class="content">
          <table class="main">
            <tr>
              <td class="wrapper">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <h1>${title}</h1>
                      <p>${content}</p>
                      <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
                        <tbody>
                          <tr>
                            <td align="left">
                              <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td> <a href="${ctaLink}" target="_blank">${ctaText}</a> </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p>If you didn't request this, please ignore this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <div class="footer">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td class="content-block">
                  <span class="apple-link">My Company Inc, 123 Street Road, City, Country</span>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </td>
      <td>&nbsp;</td>
    </tr>
  </table>
</body>
</html>
`

const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  try {
    await db_init()
    const templateRepo = TemplateDataSource.getRepository(Template)

    // Check if seeded
    const count = await templateRepo.count()
    if (count > 0) {
      logger.info("Database already populated. Skipping seed.")
      return
    }

    logger.info("Seeding templates...")

    const templates = [
      // EMAIL TEMPLATES
      {
        name: "welcome_email",
        type: TemplateType.EMAIL,
        subject: "Welcome to the Family, {{name}}!",
        body: wrapEmail(
          "Welcome, {{name}}!",
          "We're so excited to have you on board. To get started and explore your new account, please click the button below.",
          "{{link}}",
          "Get Started",
        ),
        action_url: "{{link}}",
        metadata: { category: "onboarding", importance: "high" },
      },
      {
        name: "password_reset",
        type: TemplateType.EMAIL,
        subject: "Reset Your Password",
        body: wrapEmail(
          "Password Reset Request",
          "Hello {{name}}, we received a request to reset your password. If you made this request, click the button below.",
          "{{link}}",
          "Reset Password",
        ),
        action_url: "{{link}}",
        metadata: { category: "security", importance: "critical" },
      },
      {
        name: "order_confirmation",
        type: TemplateType.EMAIL,
        subject: "Your Order is Confirmed!",
        body: wrapEmail(
          "Thanks for your order, {{name}}!",
          "We've received your order #{{order_id}} and are getting it ready. You can view your order details and status by clicking the button below.",
          "{{link}}",
          "View Order Details",
        ),
        action_url: "{{link}}",
        metadata: { category: "transactional" },
      },
      {
        name: "account_verification",
        type: TemplateType.EMAIL,
        subject: "Verify Your Account",
        body: wrapEmail(
          "Almost there, {{name}}!",
          "Please verify your email address to complete your registration. Click the button below to activate your account.",
          "{{link}}",
          "Verify Account",
        ),
        action_url: "{{link}}",
        metadata: { category: "security" },
      },

      // PUSH NOTIFICATION TEMPLATES
      {
        name: "push_new_message",
        type: TemplateType.PUSH,
        subject: "New Message from {{sender_name}}",
        body: "{{message_preview}}",
        image_url: `https://picsum.photos/${randomNumber(500, 599)}`,
        action_url: "myapp://chat/{{chat_id}}",
        metadata: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          sound: "default",
          channel_id: "messages",
          priority: "high",
        },
      },
      {
        name: "push_order_shipped",
        type: TemplateType.PUSH,
        subject: "Order Shipped! 📦",
        body: "Your order #{{order_id}} is on its way. Track it now.",
        image_url: `https://picsum.photos/${randomNumber(600, 699)}`,
        action_url: "myapp://orders/{{order_id}}",
        metadata: {
          channel_id: "orders",
          screen: "OrderDetailScreen",
        },
      },
      {
        name: "push_promo_sale",
        type: TemplateType.PUSH,
        subject: "Flash Sale Alert! ⚡",
        body: "Get 50% off on all {{category}} items. Offer ends in 2 hours!",
        image_url: `https://picsum.photos/${randomNumber(700, 799)}`,
        action_url: "myapp://shop/category/{{category_id}}",
        metadata: {
          channel_id: "marketing",
          analytics_label: "flash_sale_campaign_v1",
        },
      },
    ]

    await templateRepo.save(templates)
    logger.info(`✅ Seeded ${templates.length} templates successfully!`)
  } catch (error) {
    logger.error(error, "❌ Error seeding templates:")
  } finally {
    await db_destroy()
  }
})()
