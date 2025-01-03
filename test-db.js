require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('正在连接数据库...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('数据库连接成功！');

        // 测试写入数据
        const Test = mongoose.model('Test', { name: String, date: Date });
        const testDoc = new Test({ 
            name: 'test', 
            date: new Date() 
        });
        await testDoc.save();
        console.log('测试数据写入成功！');

        // 读取数据
        const docs = await Test.find();
        console.log('读取的数据:', docs);

    } catch (error) {
        console.error('数据库测试失败:', error);
    } finally {
        await mongoose.disconnect();
        console.log('数据库连接已关闭');
    }
}

testConnection(); 