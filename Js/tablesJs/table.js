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

// date="2026-08-31";monday="3,3,11,11,8,8";tuesday="14,14,1,1,4";wednesday="5,9,3,3,9,16,16";thursday="0,0,5,5,6,6,1,-1";friday="5,5,2,2,1,1,15"

let monday = [];
let tuesday = [];
let wednesday = [];
let thursday = [];
let friday = [];

const paratimetable = [
    "08:30 - 10:10",
    "10:20 - 12:00",
    "12:30 - 14:10",
    "14:20 - 16:00"
];

alllessontimetable = [
    "8:30 - 9:15",
    "9:25 - 10:10",
    "10:20 - 11:05",
    "11:15 - 12:00",
    "12:30 - 13:15",
    "13:25 - 14:10",
    "14:20 - 15:05",
    "15:15 - 16:00",
];

breaktimetable = [
    "9:15 - 9:25",
    "10:10 - 10:20",
    "11:05 - 11:15",
    "12:00 - 12:30",
    "13:15 - 13:25",
    "14:10 - 14:20",
    "15:05 - 15:15"
];

const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

const teachers = Array(subjects.length).fill("Номер Кабінету:");


let date_global = new Date();
// let date_global = new Date("2026-08-31T10:11:00");
// let today = eninua(date_global.getDay());
let today = eninua(1);
let starttime = "8:30";

let lasttime = null;

const week = [
    monday,
    tuesday,
    wednesday,
    thursday,
    friday
];

const worktimetable = [""]

let currentTime = getTime();
// let currentTime = "10:";

const schedule = document.querySelector(".schedule");

const leftColumn = document.createElement("div");
leftColumn.className = "column left";

const rightColumn = document.createElement("div");
rightColumn.className = "column right";

schedule.append(leftColumn, rightColumn);

let titul = document.getElementById("titul1");
titul.innerHTML = `Розклад занять на ${getmonthwithnumber(date_global.getMonth())}`;

(async () => {
    await LoadTables(date_global);

    for (let i = 0; i < 5; i++) {
        lasttime = starttime;
        const table = createTable(`day-${i + 1}`, 4, days[i], week[i], date_global);
        if (table != null) {
            (i < 3 ? leftColumn : rightColumn).appendChild(table);
        }
    }

    // ← перевірка ТУТ, коли DOM вже містить фінальний результат
    const existingMessage = document.getElementById("message");
    if (!leftColumn.querySelector("table") && !rightColumn.querySelector("table")) {
        if (existingMessage) {
            existingMessage.style.display = "";
        } else {
            const message = document.createElement("h1");
            message.innerHTML = "Для цього дня таблиці немає";
            message.id = "message";
            document.body.appendChild(message);
        }
    } else {
        if (existingMessage) {
            existingMessage.style.display = "none";
        }
    }

    loadAllHomework();
    loadTeachers();

    document.querySelectorAll(".hmfield").forEach(el => {
        el.addEventListener("input", () => {
            saveHomework(el.id, el.value);
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
        });
    });
})();

async function changeWeek(direction) {
    date_global.setDate(date_global.getDate() + (direction * 7));

    titul.innerHTML = `Розклад занять на ${getmonthwithnumber(date_global.getMonth())}`;

    leftColumn.innerHTML = "";
    rightColumn.innerHTML = "";

    // 1. СПОЧАТКУ підвантажуємо нові дані
    await LoadTables(date_global);

    // 2. І ТІЛЬКИ ПОТІМ будуємо таблиці — вже з правильними week[i]
    for (let i = 0; i < 5; i++) {
        lasttime = starttime;
        const table = createTable(`day-${i + 1}`, 4, days[i], week[i], date_global);
        if (table != null) {
            (i < 3 ? leftColumn : rightColumn).appendChild(table);
        }
    }

    const existingMessage = document.getElementById("message");
    if (!leftColumn.querySelector("table") && !rightColumn.querySelector("table")) {
        if (existingMessage) {
            existingMessage.style.display = "";
        } else {
            const message = document.createElement("h1");
            message.innerHTML = "Для цього дня таблиці немає";
            message.id = "message";
            document.body.appendChild(message);
        }
    } else {
        if (existingMessage) {
            existingMessage.style.display = "none";
        }
    }

    loadAllHomework();
    loadTeachers();

    document.querySelectorAll(".hmfield").forEach(el => {
        el.addEventListener("input", () => {
            saveHomework(el.id, el.value);
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
        });
    });
}

function createTable(id, lessons, dayName, lesonname, baseDate) {
    if (lesonname == null) return null;

    let g = 0;
    const table = document.createElement("table");
    table.id = id;

    // Правильна перевірка "сьогодні"
    if (dayName === eninua(baseDate.getDay())) {
        table.classList.add("today");
    }

    const dateRow = document.createElement("tr");
    dateRow.innerHTML = `
        <th class="side" colspan="3">
            <button id="daybreakbtn-${dayinnumber(dayName)}" class="btn-breaktoggle" onclick="togglebreak(${dayinnumber(dayName)})">▼</button>
            ${getDateAndDay(dayName, baseDate)}
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

    for (let i = 1; i <= lessons; i++) {

        let row = document.createElement("tr");
        row.className = "lesson-row";

        if (getCurrentLesson(i, paratimetable) && dayName === eninua(baseDate.getDay())) {
            row.classList.add("currentlesson");
        }

        const hmId = `${getlessondate(getDateAndDay(dayName, baseDate))}-${lesonname[i - 1]}`;
        
        let left  = lesonname[(i - 1) * 2];
        let right = lesonname[(i - 1) * 2 + 1];

        const leftName  = getsubjectwithid(left);
        const rightName = getsubjectwithid(right);

        let lessonid;
        if (leftName === rightName) {
            lessonid = leftName ?? "немає уроку";
        } else if (leftName && rightName) {
            lessonid = `${leftName} + ${rightName}`;
        } else if (leftName) {
            lessonid = leftName;
        } else if (rightName) {
            lessonid = rightName;
        } else {
            lessonid = "немає уроку";
        }

        row.innerHTML = `
            <td>
                <span class="lesson-number">
                <button class="btn-open" id="day${dayinnumber(dayName)}-btn-${i}" data-open="false" onclick="openClose(${i}, ${dayinnumber(dayName)})">▼</button>
                ${i}.</span>
                
                <span class="lesson-name">${lessonid}</span>
            </td>
            <td>
                <textarea class="hmfield" id="${hmId}">немає</textarea>
            </td>
            <td>${paratimetable[i-1]}</td>
        `;
        table.appendChild(row);
        
        for (let j = 0; j < 2; j++) {
            g += 1;
            const subjectId = (j === 0) ? left : right;

            if (subjectId == null || subjectId === -1) continue;

            const infoBtnId = `day${dayinnumber(dayName)}-info-${i}-${j}`;

            let para = document.createElement("tr");
            para.innerHTML = `
                <td>
                    <div class="cell-collapse"><div class="cell-collapse-inner">
                        <div class="lesson-detail-row">
                            <span class="lesson-detail-name">${g}. ${getsubjectwithid(subjectId)}</span>
                            <button id="${infoBtnId}" 
                                onmouseenter="getteacherid(this, ${subjectId})"
                                onmouseleave="hideInf()" 
                                class="btninformation">ℹ️</button>
                        </div>
                    </div></div>
                </td>
                <td colspan="2">
                    <div class="cell-collapse"><div class="cell-collapse-inner">${alllessontimetable[g-1]}</div></div>
                </td>
            `;

            const lessonrange = `${alllessontimetable[g-1]}`;

            const iscurrentlesson = isTimeInRange(lessonrange) && dayName === eninua(baseDate.getDay());

            if(iscurrentlesson){
                para.id = "currentlesson";
            }

            para.className = `day${dayinnumber(dayName)}-lesson-${i}`;
            para.classList.add("lesson-collapsed");
            para.style.display = "none";   // ← додано: без анімації при першому рендері
            table.appendChild(para);

            if (j === 0 && alllessontimetable[g] && right != null) {
                let pereriv = document.createElement("tr");
                pereriv.innerHTML = `
                    <td colspan="3">
                        <div class="cell-collapse"><div class="cell-collapse-inner">Перерва ${showbreaktime(alllessontimetable[g-1], alllessontimetable[g])} хв.</div></div>
                    </td>
                `;

                const lessonrange = `${breaktimetable[g-1]} - ${breaktimetable[g]}`;

                const iscurrentlesson = isTimeInRange(lessonrange) && dayName === eninua(baseDate.getDay());

                if(iscurrentlesson){
                    pereriv.id = "currentlesson";
                }

                pereriv.className = `day${dayinnumber(dayName)}-lesson-${i}`;
                pereriv.classList.add("lesson-collapsed");
                table.appendChild(pereriv);
            }
        }

        if (i < lessons) {
            let breakRow = document.createElement("tr");
            breakRow.className = `break break-${dayinnumber(dayName)}`;
            breakRow.innerHTML = `
                <td id="break-${i}-${dayinnumber(dayName)}" colspan="3">Перерва ${showbreaktime(paratimetable[i-1], paratimetable[i])} хв.</td>
            `;

            // реальні межі перерви беремо з paratimetable, а не з breaktimetable[i-1]
            const breakRange = `${paratimetable[i - 1].split(" - ")[1]} - ${paratimetable[i].split(" - ")[0]}`;
            const isCurrentBreak =
                isTimeInRange(breakRange) &&
                dayName === eninua(baseDate.getDay());
            
            if (isCurrentBreak) {
                breakRow.classList.add("currentbreak");  // .add(), не .id
            } else {
                breakRow.classList.toggle("break-collapsed");
            }

            table.appendChild(breakRow);
        }

        lasttime = Timecounter(i * 2, 30);
    }
    return table;
}

function getDateAndDay(dayName, today) {
    const currentDay = today.getDay();

    const days = {
        "Понеділок": 1,
        "Вівторок": 2,
        "Середа": 3,
        "Четвер": 4,
        "П'ятниця": 5
    };

    const monday = new Date(today);

    // Уніфікована логіка — та сама, що й у getMondayOfWeek
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(today.getDate() + diff);

    const result = new Date(monday);
    result.setDate(monday.getDate() + days[dayName] - 1);

    return `${result.getDate()}.${result.getMonth() + 1} — ${dayName}`;
}

function Timecounter(i,breakTime) {
    let hours = 8;
    let minutes = 30;
    minutes += breakTime;

    minutes += 45 * i;

    while (minutes >= 60) {
        hours++;
        minutes -= 60;
    }

    if(minutes > 0){
        return `${hours}:${minutes}`;
    }
    else{
        return `${hours}:00`;
    }
}



function getCurrentLesson(i) {
    const [startTime, endTime] = paratimetable[i - 1].split(" - ");

    let [startHour, startMinutes] = startTime.split(":").map(Number);
    let [endHour, endMinutes] = endTime.split(":").map(Number);
    let [currentHour, currentMinutes] = currentTime.split(":").map(Number);

    let sumstart = startHour * 60 + startMinutes;
    let sumEnd = endHour * 60 + endMinutes;
    let sumcurrent = currentHour * 60 + currentMinutes;

    return sumstart <= sumcurrent && sumcurrent < sumEnd;
}

function togglebreak(dayNum){
    document.querySelectorAll(`.break-${dayNum}:not(.currentbreak)`).forEach(row => {
        const isCollapsed = row.classList.contains("break-collapsed");

        if (isCollapsed) {
            // відкриваємо: показуємо, форс reflow, знімаємо клас — плавний розворот
            row.style.display = "";
            void row.offsetHeight;
            row.classList.remove("break-collapsed");
        } else {
            // закриваємо: спочатку анімація, ховаємо після її завершення
            row.classList.add("break-collapsed");
            row.addEventListener("transitionend", () => {
                row.style.display = "none";
            }, { once: true });
        }
    });

    const btn = document.getElementById(`daybreakbtn-${dayNum}`);
    if (btn) {
        btn.classList.toggle("collapsed");
    }
}

// 4) openClose function
function openClose(i, date1) {
    const rows = document.querySelectorAll(`.day${date1}-lesson-${i}`);
    const btn = document.getElementById(`day${date1}-btn-${i}`);
    const mainRow = btn.closest("tr");

    const isOpen = btn.dataset.open === "true";
    const willOpen = !isOpen;
    const isCurrent = mainRow.classList.contains("currentlesson");

    mainRow.classList.remove("lesson-outline-top", "outline-current");
    rows.forEach(row => row.classList.remove("lesson-outline-mid", "lesson-outline-bottom", "outline-current"));

    if (willOpen) {
        // спочатку показуємо (display), примусовий reflow, і лише потім
        // знімаємо lesson-collapsed — це і дає CSS-transition плавно відпрацювати
        rows.forEach(row => {
            row.style.display = "";
        });
        if (rows[0]) void rows[0].offsetHeight; // форс reflow

        rows.forEach(row => row.classList.remove("lesson-collapsed"));

        mainRow.classList.add("lesson-outline-top");
        if (isCurrent) mainRow.classList.add("outline-current");

        rows.forEach((row, idx) => {
            if (idx === rows.length - 1) {
                row.classList.add("lesson-outline-bottom");
            } else {
                row.classList.add("lesson-outline-mid");
            }
            if (isCurrent) row.classList.add("outline-current");
        });
    } else {
        // запускаємо анімацію згортання, а ховаємо рядок (display:none)
        // лише коли вона реально завершиться
        rows.forEach(row => {
            row.classList.add("lesson-collapsed");
            row.addEventListener("transitionend", () => {
                row.style.display = "none";
            }, { once: true });
        });
    }

    btn.dataset.open = willOpen.toString();
    btn.classList.toggle("open", willOpen);
}
function dayinnumber(day){
    for(let i = 0; i <= days.length; i++){
        if(day == days[i]){
            return i;
        }
    }
}

function getmonthwithnumber(j){
    const months = [
        "Січень", "Лютий", "Березень", "Квітень",
        "Травень", "Червень", "Липень", "Серпень",
        "Вересень", "Жовтень", "Листопад", "Грудень"
    ];
    return months[j];
}



function getteacherid(btn, teacherid){
    clearTimeout(hideTimeout);
    currentTeacherId = teacherid;

    const rect = btn.getBoundingClientRect();

    const inf = document.getElementById("inf");
    inf.style.position = "absolute";
    inf.style.left = `${rect.left + window.scrollX}px`;
    inf.style.top = `${rect.bottom + window.scrollY}px`;
    inf.value = teachers[teacherid];
    inf.style.display = "block";
    autoResize(inf);
}

let hideTimeout;

function hideInf(){
    hideTimeout = setTimeout(() => {
        document.getElementById("inf").style.display = "none";
    }, 150); // невелика затримка, щоб встигнути перейти на сам блок
}

const inf = document.getElementById("inf");

inf.addEventListener("mouseenter", () => {
    clearTimeout(hideTimeout);
});

inf.addEventListener("mouseleave", () => {
    hideInf();
});

document.addEventListener("click", (e) => {
    const inf = document.getElementById("inf");
    
    // якщо клікнули не на сам inf і не на кнопку інформації — ховаємо
    if (!e.target.closest("#inf") && !e.target.closest(".btninformation")) {
        inf.style.display = "none";
    }
});

function getsubjectwithid(id){
    if (id === -1 || id === null || id === undefined) return null;
    return subjects[id];
}

// --- добавляем переменную для текущего id учителя ---
let currentTeacherId = null;


inf.addEventListener("input", async () => {
    if (currentTeacherId !== null) {
        teachers[currentTeacherId] = inf.value;
        await saveTeacher(currentTeacherId, inf.value);
    }
    autoResize(inf);
});


function eninua(day) {
    const uadays = [
        "Неділя",      // 0
        "Понеділок",   // 1
        "Вівторок",    // 2
        "Середа",      // 3
        "Четвер",      // 4
        "П'ятниця",    // 5
        "Субота"       // 6
    ];
    return uadays[day];
}

function autoResize(el) {
    // Спочатку скидаємо розміри
    el.style.width = "auto";
    el.style.height = "auto";

    // Збільшуємо ширину під текст
    el.style.width = el.scrollWidth + "px";

    // Збільшуємо висоту
    el.style.height = el.scrollHeight + "px";
}

function getTime(){
    let hour = date_global.getHours();
    let minutes = date_global.getMinutes();

    return `${hour} : ${minutes}`;
}

function getlessondate(value){
    const date_ = value.split(" — ")[0];
    return date_;
}



async function saveTeacher(id, text) {
    const { error } = await supabaseClient.from("teachers").upsert({ id, content: text, updated_at: new Date().toISOString() });

    if (error) {
        console.error("Помилка збереження домашки:", error);
    }
}

async function loadTeachers() {
    const { data, error } = await supabaseClient
        .from("teachers")
        .select("*");

    if (error) {
        console.error("Помилка завантаження вчителів:", error);
        return;
    }

    if (data) {
        data.forEach(row => {
            teachers[Number(row.id)] = row.content;
        });
        
        // опціонально: одразу оновити localStorage як кеш
        localStorage.setItem("teachers", JSON.stringify(teachers));
    }
}

loadTeachers();


async function saveHomework(id, text) {
    const { error } = await supabaseClient.from("homework").upsert({ id, content: text, updated_at: new Date().toISOString() });

    if (error) {
        console.error("Помилка збереження домашки:", error);
    }
}



// підвантажує всю домашку одним запитом і підставляє в textarea за id
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
            el.style.height = el.scrollHeight + "px";
        }
    });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => reg.unregister());
  });
  if (window.caches) {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
}

async function SaveTables(){
    const formatted = date.toISOString().split("T")[0];
    const { data, error } = await supabaseClient
        .from("tables")
        .upsert({ 
            date: formatted,
            monday: monday,
            tuesday: tuesday,
            wednesday: wednesday,
            thursday: thursday,
            friday: friday,
        })
        .select();

    if (error) {
        console.error("Помилка:", error);
        return;
    }

    console.log("Збережено:", data);
}


function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = неділя, 1 = понеділок, ..., 6 = субота
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
}

async function LoadTables(date_take) {
    const monday_date = getMondayOfWeek(date_take);
    const dateStr = formatDateForDB(monday_date);

    const { data, error } = await supabaseClient
        .from("tables")
        .select("*")
        .eq("date", dateStr)
        .maybeSingle();

    if (error) {
        console.error("Помилка завантаження:", error);
        return;
    }

    monday = typeof data?.monday === "string" ? JSON.parse(data.monday) : data?.monday;
    tuesday = typeof data?.tuesday === "string" ? JSON.parse(data.tuesday) : data?.tuesday;
    wednesday = typeof data?.wednesday === "string" ? JSON.parse(data.wednesday) : data?.wednesday;
    thursday = typeof data?.thursday === "string" ? JSON.parse(data.thursday) : data?.thursday;
    friday = typeof data?.friday === "string" ? JSON.parse(data.friday) : data?.friday;

    week[0] = monday;
    week[1] = tuesday;
    week[2] = wednesday;
    week[3] = thursday;
    week[4] = friday;
}

function formatDateForDB(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}


function showbreaktime(first, second) {


    try{
        const first_ = first.split(" - ");
        const second_ = second.split(" - ");
        const firstEnd = first_[1];    // "10:10" — кінець першого уроку
        const secondStart = second_[0]; // "10:20" — початок другого

        const [firstHours, firstMinutes] = firstEnd.split(":").map(Number);
        const [secondHours, secondMinutes] = secondStart.split(":").map(Number);

        const firstTotal = firstHours * 60 + firstMinutes;
        const secondTotal = secondHours * 60 + secondMinutes;

        const diff = secondTotal - firstTotal;
    return diff;
    }
    catch{
        console.log("немає більше часу")
    }
}

function getCurrentLesson(i, timetable) {
    const [startTime, endTime] = timetable[i - 1].split(" - ");

    let [startHour, startMinutes] = startTime.split(":").map(Number);
    let [endHour, endMinutes] = endTime.split(":").map(Number);
    let [currentHour, currentMinutes] = currentTime.split(":").map(Number);

    let sumstart = startHour * 60 + startMinutes;
    let sumEnd = endHour * 60 + endMinutes;
    let sumcurrent = currentHour * 60 + currentMinutes;

    return sumstart <= sumcurrent && sumcurrent < sumEnd;
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

function timetoendbreak(){
    
}
