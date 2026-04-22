let timer = null;
let defaultTimeMins = 25;
let TOTAL_TIME = defaultTimeMins * 60;
let timeLeft = TOTAL_TIME;
let isRunning = false;

export function setPomodoroTime(mins) {
    if (isRunning) return; 
    
    document.querySelectorAll('.preset-btn').forEach(b => {
        b.className = "preset-btn px-4 py-2 bg-slate-800 rounded-full text-sm font-bold text-slate-300 hover:text-white hover:bg-google-blue transition-all border border-slate-700";
    });
    
    const btns = document.querySelectorAll('.preset-btn');
    btns.forEach(b => {
        if(b.textContent === mins + 'm') {
            b.className = "preset-btn px-4 py-2 bg-google-blue rounded-full text-sm font-bold text-white transition-all border border-google-blue shadow-lg shadow-blue-500/20";
        }
    });

    const customInput = document.getElementById('customPomodoroTime');
    if(customInput) customInput.value = '';

    defaultTimeMins = mins;
    TOTAL_TIME = defaultTimeMins * 60;
    resetPomodoro();
}

export function setCustomPomodoroTime(val) {
    let mins = parseInt(val);
    if (isNaN(mins) || mins <= 0) return;
    if (isRunning) return;

    document.querySelectorAll('.preset-btn').forEach(b => {
        b.className = "preset-btn px-4 py-2 bg-slate-800 rounded-full text-sm font-bold text-slate-300 hover:text-white hover:bg-google-blue transition-all border border-slate-700";
    });

    defaultTimeMins = mins;
    TOTAL_TIME = defaultTimeMins * 60;
    resetPomodoro();
}

export function togglePomodoroTimer() {
    if (isRunning) {
        clearInterval(timer);
        document.getElementById('pomodoroPlayIcon').className = 'fas fa-play ml-2';
    } else {
        timer = setInterval(tick, 1000);
        document.getElementById('pomodoroPlayIcon').className = 'fas fa-pause';
    }
    isRunning = !isRunning;
}

export function resetPomodoro() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = TOTAL_TIME;
    document.getElementById('pomodoroPlayIcon').className = 'fas fa-play ml-2';
    updateDisplay();
}

export function closePomodoro() {
    clearInterval(timer);
    isRunning = false;
    timeLeft = TOTAL_TIME;
    document.getElementById('pomodoroPlayIcon').className = 'fas fa-play ml-2';
    updateDisplay();
    document.getElementById('pomodoroView').classList.add('hidden');
}

function tick() {
    if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
    } else {
        clearInterval(timer);
        isRunning = false;
        // Fim do tempo
        import('./ux.js').then(ux => {
            if(ux.playSuccessSound) ux.playSuccessSound();
            if(ux.triggerConfetti) ux.triggerConfetti();
        });
        document.getElementById('pomodoroPlayIcon').className = 'fas fa-play ml-2';
    }
}

function updateDisplay() {
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('pomodoroTimerDisplay').textContent = `${mins}:${secs}`;
    
    const ring = document.getElementById('pomodoroRing');
    if (ring) {
        // stroke-dasharray = 283
        const offset = 283 - (283 * (timeLeft / TOTAL_TIME));
        ring.style.strokeDashoffset = offset;
    }
}
