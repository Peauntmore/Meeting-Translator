document.addEventListener('DOMContentLoaded', function() {
    const switchBtns = document.querySelectorAll('.switch-btn');
    const forms = document.querySelectorAll('.form');
    
    // 切换表单显示
    switchBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const formType = this.dataset.form;
            
            // 更新按钮状态
            switchBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 更新表单显示
            forms.forEach(form => {
                if (form.id === `${formType}Form`) {
                    form.classList.add('active');
                } else {
                    form.classList.remove('active');
                }
            });
        });
    });

    const API_URL = 'http://localhost:3000';

    // 表单提交处理
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (data.success) {
                alert('登录成功！');
                // 这里可以重定向到用户主页
                // window.location.href = '/dashboard';
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('登录失败，请稍后重试');
        }
    });

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;
        const confirmPassword = this.querySelectorAll('input[type="password"]')[1].value;

        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (data.success) {
                alert('注册成功！');
                // 切换到登录表单
                document.querySelector('[data-form="login"]').click();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('注册失败，请稍后重试');
        }
    });
}); 