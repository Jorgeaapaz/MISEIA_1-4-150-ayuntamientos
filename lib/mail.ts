import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAILHOG_HOST || 'localhost',
  port: parseInt(process.env.MAIL_PORT || '1025', 10),
  secure: false,
  auth: undefined,
});

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const link = `${baseUrl}/auth/verify?token=${token}`;

  await transporter.sendMail({
    from: '"Sede Electrónica" <noreply@sede.local>',
    to: email,
    subject: 'Tu enlace de acceso — Sede Electrónica',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Acceso a la Sede Electrónica</h2>
        <p>Has solicitado acceder a la Sede Electrónica. Haz clic en el siguiente enlace para entrar:</p>
        <a href="${link}" style="display:inline-block; padding: 12px 24px; background: #3B82F6; color: #fff; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Acceder ahora
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 16px;">
          Este enlace expira en 15 minutos. Si no solicitaste este acceso, ignora este correo.
        </p>
        <p style="color: #999; font-size: 11px;">O copia esta URL: ${link}</p>
      </div>
    `,
  });
}
