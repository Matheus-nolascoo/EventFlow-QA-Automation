require('dotenv').config();

export const ENV = {
  ADMIN_USER: process.env.ADMIN_USER,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  GUEST_EMAIL: process.env.GUEST_EMAIL,
  GUEST_PHONE: process.env.GUEST_PHONE,
  EVENT_ID: process.env.EVENT_ID,
  WHATSAPP_CONTACT: process.env.WHATSAPP_CONTACT
};