/**
 * Перевірка ролі користувача.
 * Бекенд (/auth/me) ЗАВЖДИ повертає JSON з полем status,
 * але з різними HTTP-кодами:
 *   ok           -> 200
 *   pending      -> 403
 *   blocked      -> 403
 *   unauthorized -> 401
 *   not_found    -> 404
 * Тому branch робимо по data.status, а НЕ по res.status/res.ok —
 * інакше pending/blocked (403) сприймаються як "невалідний токен".
 */

const API_BASE_URL = CONFIG.API_BASE_URL;

let isPendingScreen = false;
let isBlockedScreen = false;

function showInfiniteLoading() {
  if (isBlockedScreen) return;
  isBlockedScreen = true;
  isPendingScreen = false;
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

function showPendingScreen() {
  if (isPendingScreen) return;
  isPendingScreen = true;
  document.body.innerHTML = `
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0d0f17;
        color: #e8eaf0;
        font-family: system-ui, sans-serif;
        text-align: center;
        padding: 24px;
      }
      .pending-box { max-width: 360px; }
      .pending-box h1 { font-size: 1.35rem; font-weight: 600; margin: 0 0 12px; }
      .pending-box p { opacity: 0.7; margin: 0 0 24px; font-size: 0.95rem; line-height: 1.45; }
      .dots { display: inline-flex; gap: 6px; }
      .dots span {
        width: 8px; height: 8px; border-radius: 50%;
        background: #7c9cff;
        animation: bounce 1.2s ease-in-out infinite;
      }
      .dots span:nth-child(2) { animation-delay: 0.2s; }
      .dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes bounce {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
        40% { opacity: 1; transform: scale(1); }
      }
    </style>
    <div class="pending-box">
      <h1>Очікуйте підтвердження адміністратора</h1>
      <p>Ваш акаунт створено. Як тільки адміністратор прийме заявку, сторінка оновиться автоматично.</p>
      <div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
  `;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('nickname');
  localStorage.removeItem('role');
  window.location.href = 'autorizate.html';
}

async function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'autorizate.html';
    return;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
  } catch (e) {
    // Немає з'єднання з сервером — НЕ виходимо, просто пробуємо пізніше
    console.warn('checkAuth network error', e);
    return;
  }

  let data;
  try {
    // Бекенд віддає JSON навіть для 401/403/404 — парсимо завжди
    data = await res.json();
  } catch (e) {
    // Відповідь не JSON (наприклад сервер впав із 500 і HTML-сторінкою помилки) —
    // це проблема бекенду, не чіпаємо токен
    console.warn('checkAuth: invalid JSON response', e);
    return;
  }
  
  switch (data.status) {
    case 'ok':
      if (data.nickname) localStorage.setItem('nickname', data.nickname);
      if (data.role) localStorage.setItem('role', data.role);
      if (isPendingScreen || isBlockedScreen) {
        // повертаємось із pending/blocked стану — оновлюємо сторінку
        window.location.reload();
      }
      return;

    case 'pending':
      showPendingScreen();
      return;

    case 'blocked':
      showInfiniteLoading();
      return;

    case 'unauthorized':
    case 'not_found':
      logout();
      return;

    default:
      // Невідомий статус — краще не виганяти юзера силою
      console.warn('checkAuth: unknown status', data.status);
      return;
  }
}

checkAuth();
const pollInterval = setInterval(checkAuth, 8000);