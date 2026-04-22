/**
 * modal.js — Gerenciamento do Modal de Tarefa
 * SRP: Toda lógica de abrir/fechar/submeter o modal fica aqui.
 * OCP: Para adicionar campos ao formulário (ex: energyLevel), edite apenas este arquivo.
 */

import { saveTaskDB, getTasksDB } from './db.js';
import { setTasks, showToast, tasks } from './ui.js';

const modalOverlay  = () => document.getElementById('taskModalOverlay');
const modalContent  = () => document.getElementById('taskModalContent');

/**
 * Abre o modal para criar uma nova tarefa (limpa o formulário).
 */
export function openTaskModal() {
    document.getElementById('manualTaskForm').reset();
    document.getElementById('taskIdInput').value       = '';
    document.getElementById('taskCategoryInput').value = 'Geral';
    document.getElementById('modalTitle').textContent  = 'Nova Tarefa';
    document.getElementById('modalSubtaskList').innerHTML = '';
    document.getElementById('noSubtasksHint').style.display = 'block';
    selectEnergy(null);

    const overlay = modalOverlay();
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');

    // Re-flow para disparar a animação CSS
    void overlay.offsetWidth;
    overlay.classList.remove('opacity-0');
    overlay.classList.add('opacity-100');
    modalContent().classList.remove('translate-y-full');
}

/**
 * Fecha o modal com animação de slide-down.
 */
export function closeTaskModal() {
    modalContent().classList.add('translate-y-full');
    const overlay = modalOverlay();
    overlay.classList.replace('opacity-100', 'opacity-0');
    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }, 300);
}

/**
 * Abre o modal pré-preenchido com os dados de uma tarefa existente para edição.
 * @param {string} id
 */
export function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    openTaskModal();
    document.getElementById('taskIdInput').value       = task.id;
    document.getElementById('taskTitleInput').value    = task.title;
    document.getElementById('taskDescInput').value     = task.description || '';
    document.getElementById('taskDateInput').value     = task.dueDate || '';
    document.getElementById('taskCategoryInput').value = task.category || 'Geral';
    document.getElementById('modalTitle').textContent  = 'Editar Tarefa';
    
    document.getElementById('modalSubtaskList').innerHTML = '';
    selectEnergy(task.energyLevel || null);
    
    if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(s => addModalSubtask(s.title, s.done));
    } else {
        document.getElementById('noSubtasksHint').style.display = 'block';
    }
}

/**
 * Configura o event listener do formulário de tarefa.
 * Deve ser chamado uma única vez na inicialização.
 */
export function setupModal() {
    document.getElementById('manualTaskForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const existingId = document.getElementById('taskIdInput').value;
        const id         = existingId || Date.now().toString();
        const existing   = tasks.find(t => t.id === id);

        const subtasks = Array.from(document.querySelectorAll('.modal-subtask-item'))
            .map(item => ({
                title: item.querySelector('.modal-subtask-title').value.trim(),
                done: item.querySelector('.modal-subtask-done').checked
            }))
            .filter(s => s.title !== '');

        const taskObj = {
            id,
            title:       document.getElementById('taskTitleInput').value.trim(),
            description: document.getElementById('taskDescInput').value.trim(),
            dueDate:     document.getElementById('taskDateInput').value || null,
            category:    document.getElementById('taskCategoryInput').value,
            energyLevel: document.getElementById('taskEnergyInput').value || null,
            subtasks:    subtasks,
            completed:   existing?.completed   || false,
            createdAt:   existing?.createdAt   || Date.now(),
        };

        await saveTaskDB(taskObj);
        closeTaskModal();

        const updated = await getTasksDB();
        setTasks(updated);
        showToast('Tarefa salva com sucesso');
    });
}

/**
 * Adiciona uma nova subtarefa no modal.
 */
export function addModalSubtask(title = '', done = false) {
    document.getElementById('noSubtasksHint').style.display = 'none';
    const list = document.getElementById('modalSubtaskList');
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 modal-subtask-item mb-2';
    div.innerHTML = `
        <input type="checkbox" class="modal-subtask-done w-4 h-4 text-google-blue rounded border-slate-300 focus:ring-google-blue" ${done ? 'checked' : ''}>
        <input type="text" class="flex-1 text-sm border-b-2 border-slate-100 bg-transparent px-1 py-1 focus:outline-none focus:border-google-blue modal-subtask-title transition-colors" placeholder="Nome da subtarefa" value="${title}">
        <button type="button" class="text-slate-400 hover:text-red-500 transition-colors px-2" onclick="this.parentElement.remove(); window.checkEmptySubtasks();">
            <i class="fas fa-trash text-xs"></i>
        </button>
    `;
    list.appendChild(div);
}

/**
 * Verifica se a lista de subtarefas está vazia para exibir a dica.
 */
export function checkEmptySubtasks() {
    const list = document.getElementById('modalSubtaskList');
    if (list.children.length === 0) {
        document.getElementById('noSubtasksHint').style.display = 'block';
    }
}

/**
 * Seleciona o nível de energia no modal.
 */
export function selectEnergy(level) {
    document.getElementById('taskEnergyInput').value = level || '';
    const btns = document.querySelectorAll('.energy-btn');
    btns.forEach(btn => {
        if (level && btn.dataset.energy === level) {
            btn.classList.add('ring-2', 'ring-google-blue', 'bg-blue-50');
            btn.classList.remove('bg-white');
        } else {
            btn.classList.remove('ring-2', 'ring-google-blue', 'bg-blue-50');
            btn.classList.add('bg-white');
        }
    });
}
