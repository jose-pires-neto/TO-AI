/**
 * main.js — Entry Point da Aplicação
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsabilidades:
 *  1. Importar todos os módulos em ordem de dependência.
 *  2. Expor no window.* APENAS as funções chamadas diretamente pelo HTML.
 *  3. Orquestrar a inicialização da app no DOMContentLoaded.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initDB, getTasksDB, saveTaskDB, deleteTaskDB } from './db.js';
import { setTasks, setCurrentDate, toggleCompleted, showToast, setFilter } from './ui.js';
import { openTaskModal, closeTaskModal, editTask, setupModal } from './modal.js';
import { setupMagicAdd, setupChat, autoOrganizeDay } from './ai.js';
import { switchTab, saveSettings } from './app.js';
import { backupToDrive, restoreFromDrive } from './drive.js';

// ---------------------------------------------------------------------------
// Exposição global — funções acionadas por onclick no HTML
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// toggleTask — marca/desmarca tarefa como concluída
// ---------------------------------------------------------------------------

window.toggleTask = async (id, checkboxEl) => {
    const { tasks } = await import('./ui.js');
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!task.completed) {
        checkboxEl.classList.add('check-pop');
        setTimeout(() => checkboxEl.classList.remove('check-pop'), 300);
    }

    task.completed = !task.completed;
    await saveTaskDB(task);

    const updated = await getTasksDB();
    setTasks(updated);

    if (task.completed) showToast('Mandou bem! Tarefa concluída. ✅');
};

// ---------------------------------------------------------------------------
// deleteTask — remove uma tarefa
// ---------------------------------------------------------------------------

window.deleteTask = async (id) => {
    await deleteTaskDB(id);
    const updated = await getTasksDB();
    setTasks(updated);
    showToast('Tarefa apagada');
};

// ---------------------------------------------------------------------------
// toggleSubtask — marca/desmarca uma subtarefa dentro de uma tarefa
// ---------------------------------------------------------------------------

window.toggleSubtask = async (taskId, subtaskIndex) => {
    const { tasks } = await import('./ui.js');
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    task.subtasks[subtaskIndex].done = !task.subtasks[subtaskIndex].done;
    await saveTaskDB(task);

    const updated = await getTasksDB();
    setTasks(updated);
};

// ---------------------------------------------------------------------------
// toggleSubtaskList — expande/colapsa a lista de subtarefas no card
// ---------------------------------------------------------------------------

window.toggleSubtaskList = (taskId) => {
    const list = document.getElementById(`sublist-${taskId}`);
    const icon = document.getElementById(`subicon-${taskId}`);
    if (!list) return;

    const isCollapsed = list.classList.contains('subtask-list-collapsed');
    list.classList.toggle('subtask-list-collapsed', !isCollapsed);
    list.classList.toggle('subtask-list-expanded', isCollapsed);
    if (icon) icon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
};

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', async () => {
    await initDB();

    const initial = await getTasksDB();
    setTasks(initial);

    setCurrentDate();
    setupModal();
    setupMagicAdd();
    setupChat();
});