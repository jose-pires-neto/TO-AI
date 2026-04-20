/**
 * ui.js — Camada de Renderização
 * SRP: Apenas manipulação de DOM e renderização visual. Sem lógica de negócio.
 * OCP: Para mudar como uma tarefa é exibida, altere apenas este arquivo.
 */

import { CATEGORY_COLORS } from './config.js';

/** Estado local de tarefas — mantido aqui para o módulo de UI ter contexto. */
export let tasks = [];

/**
 * Define a data atual no header da view de Tarefas.
 */
export function setCurrentDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let dateString = new Date().toLocaleDateString('pt-BR', options).replace('-feira', '');
    dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    document.getElementById('currentDateDisplay').textContent = dateString;
}

/**
 * Retorna as classes CSS de cor para uma dada categoria.
 * @param {string} cat
 * @returns {string}
 */
export function getCategoryColor(cat) {
    return CATEGORY_COLORS[cat] || CATEGORY_COLORS['Geral'];
}

/**
 * Atualiza o array interno de tarefas e re-renderiza a lista.
 * @param {Object[]} taskList
 */
export function setTasks(taskList) {
    tasks = taskList;
    renderTasks();
}

/**
 * Renderiza as listas de tarefas pendentes e concluídas no DOM.
 */
export function renderTasks() {
    const pendingList = document.getElementById('taskList');
    const completedList = document.getElementById('completedTaskList');
    const emptyState = document.getElementById('emptyTasks');
    const completedContainer = document.getElementById('completedTasksContainer');

    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    // Estado vazio
    emptyState.classList.toggle('hidden', pending.length > 0);
    emptyState.classList.toggle('flex', pending.length === 0);

    // Seção de concluídas
    document.getElementById('completedCount').textContent = completed.length;
    completedContainer.classList.toggle('hidden', completed.length === 0);

    pending.forEach(task => pendingList.appendChild(createTaskElement(task)));
    completed.forEach(task => completedList.appendChild(createTaskElement(task)));
}

/**
 * Cria e retorna o elemento DOM de uma tarefa.
 * @param {Object} task
 * @returns {HTMLElement}
 */
export function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `bg-white p-4 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md ${task.completed ? 'opacity-60 bg-slate-50' : ''}`;

    // Badge de data/hora
    let dateBadge = '';
    if (task.dueDate) {
        const d = new Date(task.dueDate);
        const isLate = !task.completed && d < new Date();
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        dateBadge = `<div class="mt-2 text-[11px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 ${isLate ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}">
            <i class="${isLate ? 'fas fa-exclamation-circle' : 'far fa-clock'}"></i> ${dateStr}
        </div>`;
    }

    const catBadge = task.category
        ? `<span class="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${getCategoryColor(task.category)}">${task.category}</span>`
        : '';

    div.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="pt-1 shrink-0">
                <div onclick="window.toggleTask('${task.id}', this)"
                    class="w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${task.completed ? 'bg-google-blue border-google-blue' : 'border-slate-300 hover:border-google-blue hover:bg-blue-50'}">
                    ${task.completed ? '<i class="fas fa-check text-white text-[10px]"></i>' : ''}
                </div>
            </div>
            <div class="flex-1 min-w-0" onclick="window.editTask('${task.id}')">
                <h4 class="font-semibold text-base truncate transition-all ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}">
                    ${task.title} ${catBadge}
                </h4>
                ${task.description ? `<p class="text-sm text-slate-500 mt-0.5 line-clamp-1">${task.description}</p>` : ''}
                ${dateBadge}
            </div>
            <button onclick="window.deleteTask('${task.id}')" class="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0">
                <i class="fas fa-trash-alt text-sm"></i>
            </button>
        </div>`;

    return div;
}

/**
 * Alterna a visibilidade da lista de tarefas concluídas.
 */
export function toggleCompleted() {
    const list = document.getElementById('completedTaskList');
    const icon = document.getElementById('completedIcon');
    list.classList.toggle('hidden');
    icon.style.transform = list.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}

/**
 * Exibe um toast de notificação temporário.
 * @param {string} message
 */
export function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = message;
    toast.style.transform = 'translate(-50%, 0) scale(1)';
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -10px) scale(0.95)';
    }, 3500);
}
