import * as nodemailer from 'nodemailer';

const formatEmailHtml = (content: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .email-content {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 14px;
            line-height: 1.8;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
${content}
        </div>
    </div>
</body>
</html>
  `;
};

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

    const formattedHtml = formatEmailHtml(htmlContent);

    const mailOptions = {
      from,
      to,
      subject,
      html: formattedHtml
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
