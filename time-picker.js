// ======================================================
// SELETOR DE HORÁRIO INTUITIVO
// ======================================================
(() => {
    const picker = document.getElementById("timePicker");
    if (!picker) return;

    const hourValue = document.getElementById("hourValue");
    const minuteValue = document.getElementById("minuteValue");
    const hourDisplay = document.getElementById("hourDisplay");
    const minuteDisplay = document.getElementById("minuteDisplay");
    const summary = document.getElementById("timeSummary");
    const hidden = document.getElementById("scheduleTime");

    let hour = 8;
    let minute = 0;

    function renderTime() {
        const h = String(hour).padStart(2, "0");
        const m = String(minute).padStart(2, "0");
        hourValue.textContent = h;
        minuteValue.textContent = m;
        hourDisplay.textContent = h;
        minuteDisplay.textContent = m;
        hidden.value = `${h}:${m}`;
        summary.textContent = `${h}:${m}`;
    }

    function change(type, step) {
        if (type === "hour") {
            hour = (hour + step + 24) % 24;
        } else {
            minute = (minute + step + 60) % 60;
        }
        renderTime();
    }

    picker.querySelectorAll("[data-time]").forEach(button => {
        button.addEventListener("click", () => {
            change(button.dataset.time, Number(button.dataset.step));
        });
    });

    picker.querySelectorAll("[data-quick]").forEach(button => {
        button.addEventListener("click", () => {
            const [h, m] = button.dataset.quick.split(":").map(Number);
            hour = h;
            minute = m;
            renderTime();
        });
    });

    hourDisplay.addEventListener("click", () => {
        hourDisplay.classList.add("active");
        minuteDisplay.classList.remove("active");
    });

    minuteDisplay.addEventListener("click", () => {
        minuteDisplay.classList.add("active");
        hourDisplay.classList.remove("active");
    });

    renderTime();
})();
