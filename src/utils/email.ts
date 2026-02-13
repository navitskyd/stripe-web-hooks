import * as nodemailer from 'nodemailer';

export const sendHtmlEmail = async (
  from: string,
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  try {
    const password = process.env.GMAIL_APP_PASSWORD;
    if (!password) {
      throw new Error('GMAIL_APP_PASSWORD environment variable not set');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: from,
        pass: password
      }
    });

    const mailOptions = {
      from,
      to,
      subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Error sending email:', errMsg);
    throw err;
  }
};

export const sendEmail = async (
  from: string,
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  await sendHtmlEmail(from, to, subject, htmlContent);
};
