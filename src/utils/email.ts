import * as nodemailer from 'nodemailer';

export const sendHtmlEmail = async (
  from: string,
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  try {
    const password = process.env.GMAIL_APP_PASSWORD;
    const user = process.env.GMAIL_USER;
    if (!password) {
      throw new Error('GMAIL_APP_PASSWORD environment variable not set');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      //secure: true,
      auth: {
        user: user,
        pass: password
      },
      debug: false, // show debug output
  logger: false, // log information in console
  pool: true,
  socketTimeout: 3000,
  from: from
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
