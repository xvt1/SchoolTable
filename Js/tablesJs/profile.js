const profileBtn = document.getElementById('profile');
const profileMenu = document.getElementById('profileMenu');
const loginbtn = document.getElementById('loginBtn');
const registerbtn = document.getElementById('registerBtn');

if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Гість без токена: одразу на логін, меню профілю йому не потрібне
        if (!localStorage.getItem('token')) {
            window.location.href = 'autorizate.html';
            return;
        }

        profileMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
            profileMenu.classList.remove('open');
        }
    });
}

window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Гість: розклад лишається видимим, просто кнопка каже "Увійти"
        if (profileBtn) {
            profileBtn.style.display = 'none';
        }
        return;
    }
    const nick = localStorage.getItem('nickname');
    if (nick && profileBtn) {
        profileBtn.textContent = nick;
    }
});

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
    localStorage.removeItem('role');

    if (profileMenu) {
        profileMenu.classList.remove('open');
    }

    window.location.href = 'autorizate.html';
}

function handleLoginRedirect() {
    window.location.href = 'autorizate.html';
}

function handleRegisterRedirect() {
    window.location.href = 'autorizate.html#signup';
}
