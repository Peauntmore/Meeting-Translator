const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (email, verificationToken) => {
    try {
        await transporter.sendMail({
            from: `"会议录制翻译" <1160255680@qq.com>`,
            to: email,
            subject: '邮箱验证',
            html: `
                <h1>欢迎注册</h1>
                <p>请点击下面的链接验证您的邮箱：</p>
                <a href="${process.env.SITE_URL}/verify-email/${verificationToken}">验证邮箱</a>
                <p>链接有效期为24小时</p>
            `
        });
        logger.info(`验证邮件已发送至 ${email}`);
    } catch (error) {
        logger.error('发送验证邮件失败:', error);
        throw error;
    }
};

module.exports = { sendVerificationEmail }; 