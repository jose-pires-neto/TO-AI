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

        const taskObj = {
            id,
            title:       document.getElementById('taskTitleInput').value.trim(),
            description: document.getElementById('taskDescInput').value.trim(),
            dueDate:     document.getElementById('taskDateInput').value || null,
            category:    document.getElementById('taskCategoryInput').value,
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
