/**
 * main.js — Entry Point da Aplicação
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsabilidades:
 *  1. Importar todos os módulos em ordem de dependência.
 *  2. Expor no window.* APENAS as funções chamadas diretamente pelo HTML
 *     (atributos onclick). Módulos com ES Modules são scoped — sem isso,
 *     o HTML não consegue chamar as funções.
 *  3. Orquestrar a inicialização da app no DOMContentLoaded.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// --- Módulos de domínio ---
import { initDB, getTasksDB, saveTaskDB, deleteTaskDB } from './db.js';
import { setTasks, setCurrentDate, toggleCompleted, showToast } from './ui.js';
import { openTaskModal, closeTaskModal, editTask, setupModal } from './modal.js';
import { setupMagicAdd, setupChat } from './ai.js';
import { switchTab, saveSettings } from './app.js';
import { backupToDrive, restoreFromDrive } from './drive.js';

// ---------------------------------------------------------------------------
// Exposição global — necessário para atributos onclick no HTML
// (Apenas funções acionadas diretamente pelo HTML precisam estar aqui)
// ---------------------------------------------------------------------------

window.switchTab        = switchTab;
window.openTaskModal    = openTaskModal;
window.closeTaskModal   = closeTaskModal;
window.editTask         = editTask;
window.toggleCompleted  = toggleCompleted;
window.saveSettings     = saveSettings;
window.backupToDrive    = backupToDrive;
window.restoreFromDrive = restoreFromDrive;

/**
 * Marca/desmarca uma tarefa como concluída.
 * Exposta globalmente pois é chamada pelo onclick do createTaskElement (ui.js).
 * @param {string} id
 * @param {HTMLElement} checkboxEl
 */
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

    if (task.completed) showToast('Mandou bem! Tarefa concluída.');
};

/**
 * Remove uma tarefa pelo ID.
 * Exposta globalmente pois é chamada pelo onclick do createTaskElement (ui.js).
 * @param {string} id
 */
window.deleteTask = async (id) => {
    await deleteTaskDB(id);
    const updated = await getTasksDB();
    setTasks(updated);
    showToast('Tarefa apagada');
};

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', async () => {
    // 1. Banco de dados
    await initDB();

    // 2. Carrega e renderiza tarefas
    const initial = await getTasksDB();
    setTasks(initial);

    // 3. Data atual no header
    setCurrentDate();

    // 4. Event listeners dos componentes
    setupModal();
    setupMagicAdd();
    setupChat();
});
