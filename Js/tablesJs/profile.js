const profileBtn = document.getElementById('profile');
const profileMenu = document.getElementById('profileMenu');

if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
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
        window.location.href = 'autorizate.html';
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
