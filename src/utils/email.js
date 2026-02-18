// email.js
const nodemailer = require('nodemailer');

const formatEmailHtml = (content) => {
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

const sendHtmlEmail = async (from, to, subject, htmlContent) => {
  try {
    const password = process.env.GMAIL_APP_PASSWORD;
    const user = process.env.GMAIL_USER;
    if (!password) {
      throw new Error('GMAIL_APP_PASSWORD environment variable not set');
    }
    if (!user) {
      throw new Error('GMAIL_USER environment variable not set');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS [web:103][web:105]
      auth: {
        user: user,
        pass: password,
      },
      debug: false,
      logger: false,
      pool: true,
      socketTimeout: 3000,
    });

    const formattedHtml = formatEmailHtml(htmlContent);

    const mailOptions = {
      from,
      to,
      subject,
      html: formattedHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Error sending email:', errMsg);
    throw err;
  }
};

const sendEmail = async (from, to, subject, htmlContent) => {
  return sendHtmlEmail(from, to, subject, htmlContent);
};

module.exports = {
  formatEmailHtml,
  sendHtmlEmail,
  sendEmail,
};
