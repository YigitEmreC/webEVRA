// ─────────────────────────────────────────────────────────────────────────────
//  THE E-MAIL BOT'S WORDING
//  The automatic confirmations visitors receive after using the contact form
//  or the support portal. Edit the text freely; keep the ${...} parts.
// ─────────────────────────────────────────────────────────────────────────────

import { settings } from "../public/data/settings.js";

const company = settings.companyName;

export function contactAutoReply({ name, message }) {
  return {
    subject: `We've received your message – ${company}`,
    text: `Hi ${name},

Thanks for getting in touch with ${company}. This is an automatic confirmation that your message has reached us.

[We usually reply within one working day.] If it's urgent, call us on [+31 (0)00 000 0000].

Your message:
${message}

Kind regards,
The ${company} team`,
  };
}

export function supportAutoReply({ name, ticket, type, urgency, message }) {
  return {
    subject: `[${ticket}] We've received your support request – ${company}`,
    text: `Hi ${name},

Thanks for your request. It has been registered under reference ${ticket}. Please mention this number if you contact us about it.

Request: ${type}
Urgency: ${urgency}

[What happens next, e.g. A technician will contact you within one working day to look at the problem remotely or plan a visit.]

Your description:
${message}

Kind regards,
The ${company} support team`,
  };
}
