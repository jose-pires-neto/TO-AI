/**
 * ux.js — Microinterações, Notificações e PWA
 * SRP: Centraliza o feedback sensorial para o usuário.
 */

import { getTasksDB } from './db.js';

// -------------------------------------------------------------------------
// Som de Sucesso Sintetizado (Sem arquivos MP3 externos)
// -------------------------------------------------------------------------
export function playSuccessSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(ctx.destination);

        // Frequência subindo (efeito "bling")
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.warn('UX: AudioContext bloqueado pelo navegador até interação', e);
    }
}

// -------------------------------------------------------------------------
// Efeito Visual de Confete "Zero Inbox"
// -------------------------------------------------------------------------
export function triggerConfetti() {
    const colors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#A855F7'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'absolute w-2 h-2 md:w-3 md:h-3 rounded-full opacity-80 pointer-events-none z-50';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';

        // Animação customizada em JS
        const duration = Math.random() * 2 + 2;
        const delay = Math.random() * 0.5;
        confetti.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s, opacity ${duration}s ease-in ${delay}s`;

        document.body.appendChild(confetti);

        // Disparo
        requestAnimationFrame(() => {
            const angle = Math.random() * 360;
            const distance = Math.random() * 80 + 20; // viewport height %
            confetti.style.transform = `translateY(${distance}vh) rotate(${angle}deg)`;
            confetti.style.opacity = '0';
        });

        // Limpeza
        setTimeout(() => confetti.remove(), (duration + delay) * 1000);
    }
}

// -------------------------------------------------------------------------
// Notificações Locais (Quando a aba está aberta)
// -------------------------------------------------------------------------
let notifiedTaskIds = new Set();

export async function checkDueTasks() {
    if (Notification.permission !== 'granted') return;

    try {
        const allTasks = await getTasksDB();
        const now = Date.now();
        const halfHourMs = 30 * 60 * 1000;

        allTasks.forEach(task => {
            if (!task.completed && task.dueDate) {
                const dueTime = new Date(task.dueDate).getTime();
                const diff = dueTime - now;

                // Se a tarefa vence nos próximos 30 minutos e ainda não foi notificada hoje
                if (diff > 0 && diff <= halfHourMs && !notifiedTaskIds.has(task.id)) {
                    notifiedTaskIds.add(task.id);
                    new Notification('Tarefa Próxima do Fim', {
                        body: `"${task.title}" vence em breve!`,
                        icon: 'icon-192.png' // O iOS ignorará se não for PWA stand-alone, mas Android lê bem
                    });
                }
            }
        });
    } catch (e) {
        console.error('UX: Erro ao checar notificações', e);
    }
}

export function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Inicializador
export function initUX() {
    requestNotificationPermission();
    // Checa tarefas vencendo a cada 5 minutos (requer que a aba não tenha sido suspensa ou no PWA ativo)
    setInterval(checkDueTasks, 10000); // era pra ser apenas a cada 5 segundos essa verificação, entretanto, para economizar energia vamos deixar em 10s
    // Checa 2 segundos após o load inicial
    setTimeout(checkDueTasks, 2000);
}
