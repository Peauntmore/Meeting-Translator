require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const crypto = require('crypto');
const User = require('./models/user');
const logger = require('./utils/logger');
const { sendVerificationEmail } = require('./utils/mailer');

const app = express();
const port = process.env.PORT || 3000;

// 限流配置
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制每个IP 100个请求
});

// 中间件
app.use(cors({
    origin: ['http://115.164.43.143:3000', 'http://115.164.43.143:5500', 'http://localhost:5500'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(limiter);

// 输入验证中间件
const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];

    if (!validator.isLength(username, { min: 2, max: 30 })) {
        errors.push('用户名长度必须在2-30个字符之间');
    }

    if (!validator.isEmail(email)) {
        errors.push('邮箱格式不正确');
    }

    if (!validator.isLength(password, { min: 6 })) {
        errors.push('密码至少需要6个字符');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    // 清理和转义输入
    req.body.username = validator.escape(username.trim());
    req.body.email = validator.normalizeEmail(email.trim());
    
    next();
};

// API路由
app.post('/api/register', validateRegistration, async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 检查邮箱是否已存在
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: '该邮箱已被注册' });
        }

        // 创建验证令牌
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const user = new User({
            username,
            email,
            password,
            verificationToken,
            verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24小时后过期
        });

        await user.save();
        await sendVerificationEmail(email, verificationToken);

        logger.info(`新用户注册: ${email}`);
        res.json({ 
            success: true, 
            message: '注册成功，请查收验证邮件' 
        });
    } catch (error) {
        logger.error('注册失败:', error);
        res.status(400).json({ 
            success: false, 
            message: '注册失败', 
            error: error.message 
        });
    }
});

app.get('/api/verify-email/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: '验证链接无效或已过期' 
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        logger.info(`用户邮箱验证成功: ${user.email}`);
        res.json({ success: true, message: '邮箱验证成功' });
    } catch (error) {
        logger.error('邮箱验证失败:', error);
        res.status(400).json({ 
            success: false, 
            message: '验证失败', 
            error: error.message 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证输入
        if (!validator.isEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                message: '邮箱格式不正确' 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: '邮箱或密码错误' 
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({ 
                success: false, 
                message: '请先验证邮箱' 
            });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn(`登录失败尝试: ${email}`);
            return res.status(401).json({ 
                success: false, 
                message: '邮箱或密码错误' 
            });
        }

        logger.info(`用户登录成功: ${email}`);
        res.json({ 
            success: true, 
            message: '登录成功',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        logger.error('登录失败:', error);
        res.status(400).json({ 
            success: false, 
            message: '登录失败', 
            error: error.message 
        });
    }
});

// 添加测试路由
app.get('/api/test-email', async (req, res) => {
    try {
        await sendVerificationEmail('1160255680@qq.com', 'test-token');
        res.json({ 
            success: true, 
            message: '测试邮件发送成功，请检查您的邮箱' 
        });
    } catch (error) {
        logger.error('测试邮件发送失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '测试邮件发送失败', 
            error: error.message 
        });
    }
});

// 启动服务器
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    logger.info('数据库连接成功');
    app.listen(port, '0.0.0.0', () => {
        logger.info(`服务器运行在 http://0.0.0.0:${port}`);
    });
}).catch(error => {
    logger.error('数据库连接失败:', error);
});

process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('未处理的 Promise 拒绝:', error);
}); 