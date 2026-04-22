/**
 * main.js — Entry Point da Aplicação
 * Responsabilidades: Importar, expor funções ao HTML e inicializar.
 */

import { initDB, getTasksDB, saveTaskDB, deleteTaskDB } from './db.js';
import { setTasks, setCurrentDate, toggleCompleted, showToast, setFilter } from './ui.js';
import { openTaskModal, closeTaskModal, editTask, setupModal, addModalSubtask, checkEmptySubtasks, selectEnergy } from './modal.js';
import { setupMagicAdd, setupChat, autoOrganizeDay, approveAIProposal, discardAIProposal, checkDailyBriefing } from './ai.js';
import { switchTab, saveSettings } from './app.js';
import { backupToDrive, restoreFromDrive } from './drive.js';
import { playSuccessSound, initUX } from './ux.js';
import { togglePomodoroTimer, resetPomodoro, closePomodoro, setPomodoroTime, setCustomPomodoroTime } from './pomodoro.js';

// Exposição global — funções acionadas por onclick no HTML
window.switchTab = switchTab;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.editTask = editTask;
window.toggleCompleted = toggleCompleted;
window.saveSettings = saveSettings;
window.backupToDrive = backupToDrive;
window.restoreFromDrive = restoreFromDrive;
window.autoOrganizeDay = autoOrganizeDay;
window.setFilter = setFilter;
window.approveAIProposal = approveAIProposal; // NOVA
window.discardAIProposal = discardAIProposal; // NOVA
window.addModalSubtask = addModalSubtask;
window.checkEmptySubtasks = checkEmptySubtasks;
window.selectEnergy = selectEnergy;
window.togglePomodoroTimer = togglePomodoroTimer;
window.resetPomodoro = resetPomodoro;
window.closePomodoro = closePomodoro;
window.setPomodoroTime = setPomodoroTime;
window.setCustomPomodoroTime = setCustomPomodoroTime;

window.toggleTask = async (id, checkboxEl) => {
    const { tasks } = await import('./ui.js');
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.completed) {
        checkboxEl.classList.add('check-pop');
        setTimeout(() => checkboxEl.classList.remove('check-pop'), 300);
    }

    task.completed = !task.completed;
    if (task.completed) {
        task.completedAt = Date.now();
    } else {
        delete task.completedAt;
    }
    await saveTaskDB(task);

    const updated = await getTasksDB();
    setTasks(updated);

    if (task.completed) {
        showToast('Mandou bem! Tarefa concluída. ✅');
        playSuccessSound();
        
        const pending = updated.filter(t => !t.completed);
        if (pending.length === 0 && updated.length > 0) {
            import('./ux.js').then(ux => ux.triggerConfetti());
        }
    }
};

window.deleteTask = async (id) => {
    await deleteTaskDB(id);
    const updated = await getTasksDB();
    setTasks(updated);
    showToast('Tarefa apagada');
};

window.toggleSubtask = async (taskId, subtaskIndex) => {
    const { tasks } = await import('./ui.js');
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    task.subtasks[subtaskIndex].done = !task.subtasks[subtaskIndex].done;
    await saveTaskDB(task);

    const updated = await getTasksDB();
    setTasks(updated);
};

window.toggleSubtaskList = (taskId) => {
    const list = document.getElementById(`sublist-${taskId}`);
    const icon = document.getElementById(`subicon-${taskId}`);
    if (!list) return;

    const isCollapsed = list.classList.contains('subtask-list-collapsed');
    list.classList.toggle('subtask-list-collapsed', !isCollapsed);
    list.classList.toggle('subtask-list-expanded', isCollapsed);
    if (icon) icon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
};

window.toggleFAB = () => {
    const menu = document.getElementById('fabMenu');
    const icon = document.getElementById('fabIcon');
    const isClosed = menu.classList.contains('opacity-0');
    
    if (isClosed) {
        menu.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
        icon.classList.add('rotate-45');
    } else {
        menu.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
        icon.classList.remove('rotate-45');
    }
};

window.openPomodoro = () => {
    const view = document.getElementById('pomodoroView');
    if(view) view.classList.remove('hidden');
};

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
    await initDB();

    const initial = await getTasksDB();
    setTasks(initial);

    setCurrentDate();
    setupModal();
    setupMagicAdd();
    setupChat();
    initUX();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW Error:', err));
    }

    // NOVO: Chama a triagem diária no carregamento (se não foi feita hoje)
    setTimeout(() => {
        checkDailyBriefing();
    }, 1500); // pequeno delay pra página renderizar fluída primeiro
});