import { Injectable, Logger } from '@nestjs/common';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(payload: EmailPayload): Promise<boolean> {
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.SENDGRID_FROM_EMAIL ?? 'orders@marketnest.com';

    if (!apiKey) {
      this.logger.warn(`[email skipped] To: ${payload.to} | ${payload.subject}`);
      return false;
    }

    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: payload.to }] }],
          from: { email: from, name: 'MarketNest' },
          subject: payload.subject,
          content: [
            { type: 'text/plain', value: payload.text ?? payload.subject },
            { type: 'text/html', value: payload.html },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`SendGrid error: ${err}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.error('SendGrid failed', e);
      return false;
    }
  }
}
