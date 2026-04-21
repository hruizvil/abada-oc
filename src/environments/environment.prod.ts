export const environment = {
  production: true,
  emailjs: {
    publicKey: 'QJAHmHjWBMTjPoZYK',
    serviceId: 'service_87lg5wg',
    templateId: 'template_zbo0os7',                       // Admin notification template (contact form)
    autoReplyTemplateId: 'template_6rf7ayn',              // User auto-reply template (contact form)
    batizadoAdminTemplateId: 'YOUR_BATIZADO_ADMIN_TEMPLATE_ID',   // TODO: replace after creating in EmailJS
    batizadoReplyTemplateId: 'YOUR_BATIZADO_REPLY_TEMPLATE_ID',   // TODO: replace after creating in EmailJS
    toEmail: 'capoeiraoc@gmail.com'
  },
  googleSheetUrl: 'https://script.google.com/macros/s/AKfycbxI9B3xhru5mSRTGfrJ7m2M_pb8gCUy3pnJ8N8IZvSEMEw3FkrlKDhedsOLUJXr4yGZxg/exec'
};
