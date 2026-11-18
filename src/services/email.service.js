import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.isConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    this.fromAddress = process.env.SMTP_FROM || '"Maaza Printwala" <support@maazaprintwala.com>';

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log(`[EmailService] Configured with host: ${process.env.SMTP_HOST}`);
    } else {
      console.log('[EmailService] SMTP credentials not provided. Running in development logger mode.');
    }
  }

  async sendMail({ to, subject, text, html }) {
    if (!to) return null;

    if (!this.isConfigured) {
      console.log(`[EmailService - DEV LOG] To: ${to} | Subject: ${subject}`);
      return { success: true, mode: 'dev-log' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      });
      console.log(`[EmailService] Dispatched email to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService Error] Failed to send email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  async sendPasswordResetEmail(to, resetToken, userName = 'Valued Customer') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maazaprintwala.com';
    const resetUrl = `${siteUrl}/reset-password?token=${resetToken}`;

    const subject = 'Password Reset Request - Maaza Printwala';
    const text = `Hello ${userName},\n\nYou requested a password reset for your Maaza Printwala account.\n\nPlease reset your password using the link below:\n${resetUrl}\n\nThis link is valid for 30 minutes.\n\nIf you did not request this, please ignore this email.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0082CA; margin-bottom: 16px;">Maaza Printwala</h2>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>You requested a password reset for your account. Click the button below to reset your password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0082CA; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Or copy and paste this link in your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This link is valid for 30 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `;

    return await this.sendMail({ to, subject, text, html });
  }

  async sendOrderConfirmationEmail(order) {
    if (!order || !order.contactDetails?.email) return null;

    const to = order.contactDetails.email;
    const name = order.contactDetails.fullName || 'Customer';
    const orderNumber = order.orderNumber;
    const amount = order.finalPayableAmount;

    const subject = `Order Confirmed: #${orderNumber} - Maaza Printwala`;
    const text = `Dear ${name},\n\nThank you for choosing Maaza Printwala!\n\nYour order #${orderNumber} for ₹${amount} has been successfully recorded.\nOur print production team is reviewing your specifications.\n\nThank you,\nMaaza Printwala Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0082CA;">Maaza Printwala</h2>
        <h3>Order Confirmed! (#${orderNumber})</h3>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for choosing Maaza Printwala. We have received your commercial printing order.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;"><strong>Order Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">#${orderNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;"><strong>Total Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">₹${amount}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;"><strong>Payment Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${order.paymentStatus}</td></tr>
        </table>
        <p style="font-size: 13px; color: #64748b;">Our production specialists are preparing your print files. You will receive real-time updates as your job moves through production and dispatch.</p>
      </div>
    `;

    return await this.sendMail({ to, subject, text, html });
  }

  async sendOrderStatusUpdateEmail(order, newStatus, note = '') {
    if (!order || !order.contactDetails?.email) return null;

    const to = order.contactDetails.email;
    const name = order.contactDetails.fullName || 'Customer';
    const orderNumber = order.orderNumber;

    const subject = `Update on Order #${orderNumber}: ${newStatus}`;
    const text = `Dear ${name},\n\nYour order #${orderNumber} status has been updated to: ${newStatus}.\n${note ? `Note: ${note}\n` : ''}\nThank you,\nMaaza Printwala Team`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0082CA;">Maaza Printwala</h2>
        <h3>Order Status Update</h3>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Your order <strong>#${orderNumber}</strong> status is now:</p>
        <div style="padding: 12px 20px; background-color: #f0fdf4; border: 1px solid #86efac; color: #166534; font-weight: bold; border-radius: 6px; display: inline-block;">
          ${newStatus}
        </div>
        ${note ? `<p style="margin-top: 12px; font-size: 13px; color: #475569;"><em>${note}</em></p>` : ''}
        <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Thank you for your business!</p>
      </div>
    `;

    return await this.sendMail({ to, subject, text, html });
  }
}

export default new EmailService();

