const days = [
    "Понеділок",
    "Вівторок",
    "Середа",
    "Четвер",
    "П'ятниця"
];

const subjects = [
    "Українська мова",        // 0
    "Алгебра",                // 1
    "Англійська мова",        // 2
    "Фізика",                 // 3
    "Історія України",        // 4
    "Інформатика",            // 5
    "Геометрія",              // 6
    "Українська література",  // 7
    "Біологія",               // 8
    "Фізична культура",       // 9
    "Географія",              // 10
    "Хімія",                  // 11
    "Всесвітня історія",      // 12
    "Громадянська освіта",    // 13
    "Захист України",         // 14
    "Технології",             // 15
    "Зарубіжна література"    // 16
];

// Формат запису розкладу на тиждень (для довідки, як кодуються дні в БД):
// date="2026-08-31";monday="3,3,11,11,8,8";tuesday="14,14,1,1,4";wednesday="5,9,3,3,9,16,16";thursday="0,0,5,5,6,6,1,-1";friday="5,5,2,2,1,1,15"
// Кожна пара — це 2 числа (ліва+права половина). -1 означає "немає уроку" на цій половині.

const pairTimeSlots = [
    "08:30 - 10:10",
    "10:20 - 12:00",
    "12:30 - 14:10",
    "14:20 - 16:00"
];

const halfLessonTimeSlots = [
    "8:30 - 9:15",
    "9:25 - 10:10",
    "10:20 - 11:05",
    "11:15 - 12:00",
    "12:30 - 13:15",
    "13:25 - 14:10",
    "14:20 - 15:05",
    "15:15 - 16:00",
];

const breakTimeSlots = [
    "9:15 - 9:25",
    "10:10 - 10:20",
    "11:05 - 11:15",
    "12:00 - 12:30",
    "13:15 - 13:25",
    "14:10 - 14:20",
    "15:05 - 15:15"
];

const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

const subjectRoomInfo = Array(subjects.length).fill("Номер Кабінету:");

let selectedDate = new Date();
// let selectedDate = new Date("2026-08-31T10:11:00");

let weekSchedule = [[], [], [], [], []];

let currentTime = getTime();

const scheduleContainer = document.querySelector(".schedule");

const leftColumn = document.createElement("div");
leftColumn.className = "column left";

const rightColumn = document.createElement("div");
rightColumn.className = "column right";

scheduleContainer.append(leftColumn, rightColumn);

const titleElement = document.getElementById("titul1");

renderSchedule();
loadRoomInfo();
clearStaleServiceWorkerCaches();

// ---------- Рендер розкладу ----------

async function renderSchedule() {
    titleElement.innerHTML = `Розклад занять на ${getMonthName(selectedDate.getMonth())}`;

    leftColumn.innerHTML = "";
    rightColumn.innerHTML = "";

    await loadWeekSchedule(selectedDate);

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const table = createDayTable(
            `day-${dayIndex + 1}`,
            pairTimeSlots.length,
            days[dayIndex],
            weekSchedule[dayIndex],
            selectedDate
        );
        if (table !== null) {
            (dayIndex < 3 ? leftColumn : rightColumn).appendChild(table);
        }
    }

    updateNoScheduleMessage();

    loadAllHomework();
    loadRoomInfo();

    document.querySelectorAll(".hmfield").forEach(field => {
        field.addEventListener("input", () => {
            saveHomework(field.id, field.value);
            field.style.height = "auto";
            field.style.height = `${field.scrollHeight}px`;
        });
    });
}

function updateNoScheduleMessage() {
    const hasAnyTable = leftColumn.querySelector("table") || rightColumn.querySelector("table");
    let message = document.getElementById("message");

    if (hasAnyTable) {
        if (message) message.style.display = "none";
        return;
    }

    if (message) {
        message.style.display = "";
    } else {
        message = document.createElement("h1");
        message.innerHTML = "Для цього дня таблиці немає";
        message.id = "message";
        document.body.appendChild(message);
    }
}

async function changeWeek(direction) {
    selectedDate.setDate(selectedDate.getDate() + direction * 7);
    await renderSchedule();
}

function createDayTable(tableId, pairCount, dayName, dayLessons, baseDate) {
    if (dayLessons == null) return null;

    let halfLessonIndex = 0;
    const table = document.createElement("table");
    table.id = tableId;

    if (dayName === getUkrainianDayName(baseDate.getDay())) {
        table.classList.add("today");
    }

    const dayIndex = getDayIndex(dayName);

    const dateRow = document.createElement("tr");
    dateRow.innerHTML = `
        <th class="side" colspan="3">
            <button id="daybreakbtn-${dayIndex}" class="btn-breaktoggle" onclick="toggleBreaksForDay(${dayIndex})">▼</button>
            ${getDateLabelForDay(dayName, baseDate)}
        </th>
    `;
    table.appendChild(dateRow);

    const header = document.createElement("tr");
    header.innerHTML = `
        <th>Предмет</th>
        <th>Домашнє завдання</th>
        <th>Час початку-час закінчення</th>
    `;
    table.appendChild(header);

    for (let pairIndex = 1; pairIndex <= pairCount; pairIndex++) {

        const row = document.createElement("tr");
        row.className = "lesson-row";

        const isCurrentPair =
            isTimeInRange(pairTimeSlots[pairIndex - 1]) &&
            dayName === getUkrainianDayName(baseDate.getDay());

        if (isCurrentPair) {
            row.classList.add("currentlesson");
        }

        const homeworkId = `${extractDateFromLabel(getDateLabelForDay(dayName, baseDate))}-${dayLessons[pairIndex - 1]}`;

        const leftSubjectId = dayLessons[(pairIndex - 1) * 2];
        const rightSubjectId = dayLessons[(pairIndex - 1) * 2 + 1];

        const leftSubjectName = getSubjectNameById(leftSubjectId);
        const rightSubjectName = getSubjectNameById(rightSubjectId);

        let lessonLabel;
        if (leftSubjectName === rightSubjectName) {
            lessonLabel = leftSubjectName ?? "немає уроку";
        } else if (leftSubjectName && rightSubjectName) {
            lessonLabel = `${leftSubjectName} + ${rightSubjectName}`;
        } else if (leftSubjectName) {
            lessonLabel = leftSubjectName;
        } else if (rightSubjectName) {
            lessonLabel = rightSubjectName;
        } else {
            lessonLabel = "немає уроку";
        }

        row.innerHTML = `
            <td>
                <span class="lesson-number">
                <button class="btn-open" id="day${dayIndex}-btn-${pairIndex}" data-open="false" onclick="toggleLessonDetails(${pairIndex}, ${dayIndex})">▼</button>
                ${pairIndex}.</span>

                <span class="lesson-name">${lessonLabel}</span>
            </td>
            <td>
                <textarea class="hmfield" id="${homeworkId}">немає</textarea>
            </td>
            <td>${pairTimeSlots[pairIndex - 1]}</td>
        `;
        table.appendChild(row);

        for (let half = 0; half < 2; half++) {
            halfLessonIndex += 1;
            const subjectId = (half === 0) ? leftSubjectId : rightSubjectId;

            if (subjectId == null || subjectId === -1) continue;

            const infoButtonId = `day${dayIndex}-info-${pairIndex}-${half}`;

            const detailRow = document.createElement("tr");
            detailRow.innerHTML = `
                <td>
                    <div class="cell-collapse"><div class="cell-collapse-inner">
                        <div class="lesson-detail-row">
                            <span class="lesson-detail-name">${halfLessonIndex}. ${getSubjectNameById(subjectId)}</span>
                            <button id="${infoButtonId}"
                                onmouseenter="showRoomInfo(this, ${subjectId})"
                                onmouseleave="hideInf()"
                                class="btninformation">ℹ️</button>
                        </div>
                    </div></div>
                </td>
                <td colspan="2">
                    <div class="cell-collapse"><div class="cell-collapse-inner">${halfLessonTimeSlots[halfLessonIndex - 1]}</div></div>
                </td>
            `;

            const isCurrentHalfLesson =
                isTimeInRange(halfLessonTimeSlots[halfLessonIndex - 1]) &&
                dayName === getUkrainianDayName(baseDate.getDay());

            if (isCurrentHalfLesson) {
                detailRow.id = "currentlesson";
            }

            detailRow.className = `day${dayIndex}-lesson-${pairIndex}`;
            detailRow.classList.add("lesson-collapsed");
            detailRow.style.display = "none"; // без анімації при першому рендері
            table.appendChild(detailRow);

            if (half === 0 && halfLessonTimeSlots[halfLessonIndex] && rightSubjectId != null) {
                const halfBreakRow = document.createElement("tr");
                halfBreakRow.innerHTML = `
                    <td colspan="3">
                        <div class="cell-collapse"><div class="cell-collapse-inner">Перерва ${getBreakDurationMinutes(halfLessonTimeSlots[halfLessonIndex - 1], halfLessonTimeSlots[halfLessonIndex])} хв.</div></div>
                    </td>
                `;

                const isCurrentHalfBreak =
                    isTimeInRange(`${breakTimeSlots[halfLessonIndex - 1]}`) &&
                    dayName === getUkrainianDayName(baseDate.getDay());

                if (isCurrentHalfBreak) {
                    halfBreakRow.id = "currentlesson";
                }

                halfBreakRow.className = `day${dayIndex}-lesson-${pairIndex}`;
                halfBreakRow.classList.add("lesson-collapsed");
                table.appendChild(halfBreakRow);
            }
        }

        if (pairIndex < pairCount) {
            const breakRow = document.createElement("tr");
            breakRow.className = `break break-${dayIndex}`;
            breakRow.innerHTML = `
                <td id="break-${pairIndex}-${dayIndex}" colspan="3">Перерва ${getBreakDurationMinutes(pairTimeSlots[pairIndex - 1], pairTimeSlots[pairIndex])} хв.</td>
            `;

            // реальні межі перерви беремо з pairTimeSlots, а не з breakTimeSlots[pairIndex-1]
            const breakRange = `${pairTimeSlots[pairIndex - 1].split(" - ")[1]} - ${pairTimeSlots[pairIndex].split(" - ")[0]}`;
            const isCurrentBreak =
                isTimeInRange(breakRange) &&
                dayName === getUkrainianDayName(baseDate.getDay());

            if (isCurrentBreak) {
                breakRow.classList.add("currentbreak");
            } else {
                breakRow.classList.toggle("break-collapsed");
            }

            table.appendChild(breakRow);
        }
    }
    return table;
}

function getDateLabelForDay(dayName, baseDate) {
    const currentDay = baseDate.getDay();

    const isoWeekdayByDayName = {
        "Понеділок": 1,
        "Вівторок": 2,
        "Середа": 3,
        "Четвер": 4,
        "П'ятниця": 5
    };

    const mondayDate = new Date(baseDate);

    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    mondayDate.setDate(baseDate.getDate() + diff);

    const result = new Date(mondayDate);
    result.setDate(mondayDate.getDate() + isoWeekdayByDayName[dayName] - 1);

    return `${result.getDate()}.${result.getMonth() + 1} — ${dayName}`;
}

// ---------- Плавне розгортання/згортання рядків (стійке до частих кліків) ----------

// Для кожного рядка зберігаємо, яким користувач ХОЧЕ його бачити НАПРИКІНЦІ,
// незалежно від того, скільки разів клікнули під час анімації. Це прибирає
// гонитву станів між CSS-переходом і DOM-класом, яка при швидких кліках
// призводила до того, що кнопка показувала "відкрито", а вміст був порожній
// (display:none виставлявся заднім числом попереднім transitionend-хендлером).
const rowDesiredOpen = new WeakMap();

const pendingRowTransitions = new WeakMap();

function cancelPendingRowTransition(row) {
    const previousHandler = pendingRowTransitions.get(row);
    if (previousHandler) {
        row.removeEventListener("transitionend", previousHandler);
        pendingRowTransitions.delete(row);
    }
}

function setRowOpen(row, open, collapsedClass) {
    rowDesiredOpen.set(row, open);
    cancelPendingRowTransition(row);

    if (open) {
        row.style.display = "";
        void row.offsetHeight; // форс reflow, щоб перехід стартував з нуля
        row.classList.remove(collapsedClass);
    } else {
        row.classList.add(collapsedClass);

        const handler = () => {
            // Ставимо display:none ТІЛЬКИ якщо бажаний стан рядка все ще
            // "закрито" на момент завершення переходу. Якщо користувач
            // встиг знову відкрити рядок — ігноруємо цей застарілий колбек.
            if (rowDesiredOpen.get(row) === false) {
                row.style.display = "none";
            }
            pendingRowTransitions.delete(row);
        };
        pendingRowTransitions.set(row, handler);
        row.addEventListener("transitionend", handler, { once: true });
    }
}

function toggleBreaksForDay(dayIndex) {
    const toggleButton = document.getElementById(`daybreakbtn-${dayIndex}`);
    const willOpen = toggleButton ? toggleButton.dataset.open !== "true" : true;

    document.querySelectorAll(`.break-${dayIndex}:not(.currentbreak)`).forEach(row => {
        setRowOpen(row, willOpen, "break-collapsed");
    });

    if (toggleButton) {
        toggleButton.dataset.open = String(willOpen);
        toggleButton.classList.toggle("collapsed", !willOpen);
    }
}

function toggleLessonDetails(pairIndex, dayIndex) {
    const toggleButton = document.getElementById(`day${dayIndex}-btn-${pairIndex}`);
    const detailRows = document.querySelectorAll(`.day${dayIndex}-lesson-${pairIndex}`);
    const mainRow = toggleButton.closest("tr");

    // Джерело правди — dataset кнопки (оновлюється синхронно на кожен клік),
    // а НЕ клас рядків, який під час анімації тимчасово не відповідає
    // реальному намірy користувача.
    const isOpen = toggleButton.dataset.open === "true";
    const willOpen = !isOpen;
    const isCurrentLesson = mainRow.classList.contains("currentlesson");

    mainRow.classList.remove("lesson-outline-top", "outline-current");
    detailRows.forEach(row => row.classList.remove("lesson-outline-mid", "lesson-outline-bottom", "outline-current"));

    detailRows.forEach(row => setRowOpen(row, willOpen, "lesson-collapsed"));

    if (willOpen) {
        mainRow.classList.add("lesson-outline-top");
        if (isCurrentLesson) mainRow.classList.add("outline-current");

        detailRows.forEach((row, index) => {
            row.classList.add(index === detailRows.length - 1 ? "lesson-outline-bottom" : "lesson-outline-mid");
            if (isCurrentLesson) row.classList.add("outline-current");
        });
    }

    toggleButton.dataset.open = willOpen.toString();
    toggleButton.classList.toggle("open", willOpen);
}

// ---------- Допоміжні функції ----------

function getDayIndex(dayName) {
    for (let i = 0; i < days.length; i++) {
        if (dayName === days[i]) {
            return i;
        }
    }
}

function getMonthName(monthIndex) {
    const months = [
        "Січень", "Лютий", "Березень", "Квітень",
        "Травень", "Червень", "Липень", "Серпень",
        "Вересень", "Жовтень", "Листопад", "Грудень"
    ];
    return months[monthIndex];
}

function getUkrainianDayName(jsDayIndex) {
    const uadays = [
        "Неділя",      // 0
        "Понеділок",   // 1
        "Вівторок",    // 2
        "Середа",      // 3
        "Четвер",      // 4
        "П'ятниця",    // 5
        "Субота"       // 6
    ];
    return uadays[jsDayIndex];
}

function getSubjectNameById(id) {
    if (id === -1 || id === null || id === undefined) return null;
    return subjects[id];
}

function getTime() {
    const hour = selectedDate.getHours();
    const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
    return `${hour}:${minutes}`;
}

function extractDateFromLabel(dateLabel) {
    return dateLabel.split(" — ")[0];
}

function getBreakDurationMinutes(firstRange, secondRange) {
    try {
        const firstEnd = firstRange.split(" - ")[1];
        const secondStart = secondRange.split(" - ")[0];

        const [firstHours, firstMinutes] = firstEnd.split(":").map(Number);
        const [secondHours, secondMinutes] = secondStart.split(":").map(Number);

        const firstTotal = firstHours * 60 + firstMinutes;
        const secondTotal = secondHours * 60 + secondMinutes;

        return secondTotal - firstTotal;
    } catch {
        console.log("немає більше часу");
    }
}

function isTimeInRange(rangeStr) {
    const [startTime, endTime] = rangeStr.split(" - ");
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const [ch, cm] = currentTime.split(":").map(Number);

    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const cur = ch * 60 + cm;

    return start <= cur && cur < end;
}

// ---------- Підказка з номером кабінету ----------

let activeInfoSubjectId = null;
let hideTimeout;

const infoBox = document.getElementById("inf");

function showRoomInfo(button, subjectId) {
    clearTimeout(hideTimeout);
    activeInfoSubjectId = subjectId;

    const rect = button.getBoundingClientRect();

    infoBox.style.position = "absolute";
    infoBox.style.left = `${rect.left + window.scrollX}px`;
    infoBox.style.top = `${rect.bottom + window.scrollY}px`;
    infoBox.value = subjectRoomInfo[subjectId];
    infoBox.style.display = "block";
    autoResize(infoBox);
}

function hideInf() {
    hideTimeout = setTimeout(() => {
        infoBox.style.display = "none";
    }, 150); // невелика затримка, щоб встигнути перейти на сам блок
}

infoBox.addEventListener("mouseenter", () => {
    clearTimeout(hideTimeout);
});

infoBox.addEventListener("mouseleave", () => {
    hideInf();
});

infoBox.addEventListener("input", async () => {
    if (activeInfoSubjectId !== null) {
        subjectRoomInfo[activeInfoSubjectId] = infoBox.value;
        await saveRoomInfo(activeInfoSubjectId, infoBox.value);
    }
    autoResize(infoBox);
});

document.addEventListener("click", (e) => {
    if (!e.target.closest("#inf") && !e.target.closest(".btninformation")) {
        infoBox.style.display = "none";
    }
});

function autoResize(el) {
    el.style.width = "auto";
    el.style.height = "auto";
    el.style.width = `${el.scrollWidth}px`;
    el.style.height = `${el.scrollHeight}px`;
}

// ---------- Supabase ----------

async function saveRoomInfo(id, text) {
    const { error } = await supabaseClient
        .from("teachers")
        .upsert({ id, content: text, updated_at: new Date().toISOString() });

    if (error) {
        console.error("Помилка збереження кабінету:", error);
    }
}

async function loadRoomInfo() {
    const { data, error } = await supabaseClient
        .from("teachers")
        .select("*");

    if (error) {
        console.error("Помилка завантаження кабінетів:", error);
        return;
    }

    if (data) {
        data.forEach(row => {
            subjectRoomInfo[Number(row.id)] = row.content;
        });

        localStorage.setItem("teachers", JSON.stringify(subjectRoomInfo));
    }
}

async function saveHomework(id, text) {
    const { error } = await supabaseClient
        .from("homework")
        .upsert({ id, content: text, updated_at: new Date().toISOString() });

    if (error) {
        console.error("Помилка збереження домашки:", error);
    }
}

async function loadAllHomework() {
    const { data, error } = await supabaseClient.from("homework").select("id, content");

    if (error) {
        console.error("Помилка завантаження домашки:", error);
        return;
    }

    data.forEach(row => {
        const el = document.getElementById(row.id);
        if (el) {
            el.value = row.content;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
        }
    });
}

function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = неділя, 1 = понеділок, ..., 6 = субота
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function formatDateForDB(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

async function loadWeekSchedule(baseDate) {
    const mondayDate = getMondayOfWeek(baseDate);
    const dateKey = formatDateForDB(mondayDate);

    const { data, error } = await supabaseClient
        .from("tables")
        .select("*")
        .eq("date", dateKey)
        .maybeSingle();

    if (error) {
        console.error("Помилка завантаження розкладу:", error);
        return;
    }

    const parseDay = value => (typeof value === "string" ? JSON.parse(value) : value);

    weekSchedule = [
        parseDay(data?.monday),
        parseDay(data?.tuesday),
        parseDay(data?.wednesday),
        parseDay(data?.thursday),
        parseDay(data?.friday)
    ];
}

function clearStaleServiceWorkerCaches() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
    });

    if (window.caches) {
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        });
    }
}