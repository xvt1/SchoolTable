const timer = document.createElement("h1");
document.body.appendChild(timer);

function getTargetDate(hh, mm) {
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    return target;
}

function updateTimer() {
    const now = new Date();
    let target = getTargetDate(17, 25);

    // якщо час уже минув сьогодні — рахуємо до завтра
    if (target < now) {
        target.setDate(target.getDate() + 1);
    }

    let diffMs = target - now;
    let totalSeconds = Math.floor(diffMs / 1000);

    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;

    if(hours <= 0){
        timer.innerHTML = `${minutes}m ${seconds}s`;
    }else if(minutes <= 0){
        timer.innerHTML = `${seconds}s`;
    }else if(seconds <= 0){
        timer.innerHTML = ``;
    }
}

updateTimer();
setInterval(updateTimer, 1000);