require('dotenv').config();
const { sendVerificationEmail } = require('./utils/mailer');

const testEmail = async () => {
    try {
        // 这里使用一个测试邮箱地址
        const testEmailAddress = '1160255680@qq.com'; // 可以先发给自己测试
        const testToken = 'test-verification-token-123';
        
        console.log('开始发送测试邮件...');
        await sendVerificationEmail(testEmailAddress, testToken);
        console.log('测试邮件发送成功！');
        console.log('请检查邮箱:', testEmailAddress);
    } catch (error) {
        console.error('测试邮件发送失败:', error);
    } finally {
        process.exit();
    }
};

// 运行测试
testEmail(); 