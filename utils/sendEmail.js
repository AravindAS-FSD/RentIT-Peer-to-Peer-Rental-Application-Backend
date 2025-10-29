import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME, // Your Gmail address from .env file
            pass: process.env.EMAIL_PASSWORD, // Your Gmail App Password from .env file
        },
    });

    const mailOptions = {
        from: 'Renit Support <noreply@renit.com>',
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;