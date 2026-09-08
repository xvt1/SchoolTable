(function () {
  let date = "";
  let monday = [];
  let tuesday = [];
  let wednesday = [];
  let thursday = [];
  let friday = [];

  function parseFullString(fullText) {
    const errors = [];

    function extractDay(dayName) {
      const regex = new RegExp(`${dayName}\\s*=\\s*"([^"]*)"`);
      const match = fullText.match(regex);

      if (!match) return [];

      const raw = match[1].trim();
      if (raw === "") return [];

      const numbers = raw.split(',').map(s => Number(s.trim()));

      if (numbers.some(n => isNaN(n))) {
        errors.push(`Некоректні дані у полі "${dayName}": "${raw}" (мають бути числа через кому)`);
        return [];
      }

      return numbers;
    }

    const dateRegex = /date\s*=\s*"([^"]*)"/;
    const dateMatch = fullText.match(dateRegex);

    if (!dateMatch) {
      errors.push('Відсутнє поле "date"');
      date = "";
    } else {
      const rawDate = dateMatch[1].trim();
      const dateFormatOk = /^\d{4}-\d{2}-\d{2}$/.test(rawDate);
      if (!dateFormatOk) {
        errors.push(`Некоректний формат дати: "${rawDate}" (очікується РРРР-ММ-ДД)`);
        date = "";
      } else {
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) {
          errors.push(`Дата "${rawDate}" не існує`);
          date = "";
        } else {
          date = rawDate;
        }
      }
    }

    monday = extractDay('monday');
    tuesday = extractDay('tuesday');
    wednesday = extractDay('wednesday');
    thursday = extractDay('thursday');
    friday = extractDay('friday');

    return errors;
  }

  window.add = async function () {
    const field = document.getElementById("addfield");
    const value = field.value.trim();

    if (value === "") {
      showMessage('Впишіть дані таблиці', true);
      return;
    }

    const errors = parseFullString(value);

    if (errors.length > 0) {
      showMessage(errors.join('; '), true);
      return;
    }

    if (typeof supabaseClient === "undefined") {
      showMessage('Помилка: supabaseClient не ініціалізовано', true);
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from("tables")
        .upsert({
          date: date,
          monday: JSON.stringify(monday),
          tuesday: JSON.stringify(tuesday),
          wednesday: JSON.stringify(wednesday),
          thursday: JSON.stringify(thursday),
          friday: JSON.stringify(friday)
        });

      if (error) {
        console.error("Помилка додавання в Supabase:", error.message);
        showMessage(`Помилка збереження: ${error.message}`, true);
        return;
      }

      console.log("Дані успішно збережено:", data);
      field.value = "";
      showMessage('Таблиця була успішно додана');

    } catch (err) {
      console.error("Неочікувана помилка:", err);
      showMessage(`Неочікувана помилка: ${err.message}`, true);
    }
  };

  window.promt = async function (filePath) {
    try {
      if (!filePath) {
        showMessage('Не вказано шлях до файлу', true);
        return;
      }

      const response = await fetch(filePath);

      if (!response.ok) {
        showMessage(`Файл не знайдено (${response.status})`, true);
        return;
      }

      const text = await response.text();

      if (!text || text.trim() === "") {
        showMessage('Файл порожній', true);
        return;
      }

      await navigator.clipboard.writeText(text);
      showMessage('Текст скопійовано!');

    } catch (err) {
      console.error('Помилка:', err);
      showMessage(`Помилка копіювання: ${err.message}`, true);
    }
  };

  window.showMessage = function (text, isError = false) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${isError ? '#e53935' : '#333'};
      color: #fff;
      padding: 10px 20px;
      border-radius: 8px;
      font-family: sans-serif;
      z-index: 9999;
      opacity: 1;
      transition: opacity 0.5s ease;
      max-width: 80%;
      text-align: center;
    `;
    document.body.appendChild(msg);

    setTimeout(() => {
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 500);
    }, 2500);
  };

})();