const API_BASE_URL = CONFIG.API_BASE_URL;

window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
    }
});

function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.form-panel');

    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });

    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.classList.add('active');

    const panel = document.getElementById('panel-' + tab);
    if (panel) {
        panel.style.display = 'flex';
        void panel.offsetWidth;
        panel.classList.add('active');
    }
}

function handleSignIn() {
    const username = document.getElementById('si-username').value.trim();
    const password = document.getElementById('si-password').value;

    if (!username || !password) {
        showToast('Заповніть усі поля', 'error');
        return;
    }

    fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.text().then(text => ({ ok: res.ok, status: res.status, text })))
    .then(({ ok, status, text }) => {
        if (ok) {
            localStorage.setItem('token', text);
            showToast('Вхід виконано!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        } else if (text === 'blocked' || (status === 403 && text.includes('blocked'))) {
            showInfiniteLoading();
        } else {
            showToast(text || 'Помилка входу', 'error');
        }
    })
    .catch(() => showToast('Помилка з\'єднання з сервером', 'error'));
}

function handleSignUp() {
    const nickname = document.getElementById('su-nickname').value.trim();
    const username = document.getElementById('su-username').value.trim();
    const password = document.getElementById('su-password').value;
    const repeatpassword = document.getElementById('su-repeat').value;

    if (!username) {
        showToast('Вкажіть логін', 'error');
        return;
    }
    if (!validatePassword(password, repeatpassword)) return;

    fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            password,
            nickname: nickname || username
        })
    })
    .then(res => res.text().then(text => ({ ok: res.ok, text })))
    .then(({ ok, text }) => {
        if (ok) {
            // Бекенд одразу повертає JWT, користувач у статусі PENDING
            localStorage.setItem('token', text);
            showToast('Реєстрація успішна! Очікуйте підтвердження адміністратора.', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showToast(text || 'Помилка реєстрації', 'error');
        }
    })
    .catch(() => showToast('Помилка з\'єднання з сервером', 'error'));
}

const supassword = document.getElementById("su-password");
const surepeat = document.getElementById("su-repeat");

function validatePassword(password, repeatpassword) {
    if (password !== repeatpassword) {
        showToast('Паролі не збігаються', 'error');
        supassword.classList.add("errorfield")
        surepeat.classList.add("errorfield")
        return false;
    }

    if (password.length < 8) {
        showToast('Мінімум 8 символів', 'error');
        supasspord.classList.add("errorfield")
        return false;
    }else{
        surepeat.classList.remove("errorfield")
    }
    if (!/[A-Z]/.test(password)) {
        showToast('Потрібна велика літера', 'error');
        supasspord.classList.add("errorfield")
        return false;
    }else{
        surepeat.classList.remove("errorfield")
    }
    if (!/\d/.test(password)) {
        showToast('Потрібна цифра', 'error');
        supasspord.classList.add("errorfield")
        return false;
    }else{
        surepeat.classList.remove("errorfield")
    }
    if (/\s/.test(password)) {
        showToast('Пароль не може містити пробіли', 'error');
        supasspord.classList.add("errorfield")
        return false;
    }else{
        surepeat.classList.remove("errorfield")
    }
    return true;
}

function CheckError(){

}

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    setTimeout(() => toast.className = 'toast', 3000);
}

function showInfiniteLoading() {
    document.body.innerHTML = `
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d0f17;
          font-family: system-ui, sans-serif;
        }
        .loader {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255,255,255,0.15);
          border-top-color: #7c9cff;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="loader" aria-hidden="true"></div>
    `;
}

const EYE_OPEN = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
const EYE_OFF  = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const svg = btn.querySelector('svg');
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    svg.innerHTML = isHidden ? EYE_OFF : EYE_OPEN;
    btn.setAttribute('aria-label', isHidden ? 'Приховати пароль' : 'Показати пароль');
}
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
        return; // Зупиняємо виконання, якщо користувач уже авторизований
    }

    // Автоматичне перемикання на потрібну вкладку при переході з головної сторінки
    const hash = window.location.hash; 
    if (hash === '#signup') {
        switchTab('signup'); // Перемикає на SIGN UP (Реєстрація)
    } else {
        switchTab('signin'); // Якщо хешу немає або він #signin — відкриває SIGN IN (Вхід)
    }
});

function handleBack() {
    window.location.href = 'index.html';
}