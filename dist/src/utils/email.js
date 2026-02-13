"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.sendHtmlEmail = void 0;
const nodemailer = __importStar(require("nodemailer"));
const sendHtmlEmail = async (from, to, subject, htmlContent) => {
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
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('Error sending email:', errMsg);
        throw err;
    }
};
exports.sendHtmlEmail = sendHtmlEmail;
const sendEmail = async (from, to, subject, htmlContent) => {
    await (0, exports.sendHtmlEmail)(from, to, subject, htmlContent);
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=email.js.map