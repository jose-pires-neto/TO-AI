/**
 * ui.js — Camada de Renderização
 * SRP: Apenas manipulação de DOM e renderização visual. Sem lógica de negócio.
 */

import { CATEGORY_COLORS, CATEGORY_ACCENTS } from './config.js';

export let tasks = [];
let currentFilter = 'all';

// ---------------------------------------------------------------------------
// Controle do Card de Proposta da IA
// ---------------------------------------------------------------------------
export function showAIProposalCard(messageText) {
    const card = document.getElementById('aiProposalCard');
    const textEl = document.getElementById('aiProposalText');

    textEl.textContent = messageText;

    card.classList.remove('hidden');
    // Animação de entrada
    setTimeout(() => {
        card.classList.remove('scale-95', 'opacity-0');
        card.classList.add('scale-100', 'opacity-100');
    }, 50);
}

export function hideAIProposalCard() {
    const card = document.getElementById('aiProposalCard');

    // Animação de saída
    card.classList.remove('scale-100', 'opacity-100');
    card.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        card.classList.add('hidden');
    }, 500); // aguarda a transition do css
}

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------
export function setFilter(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isActive = btn.dataset.filter === filter;
        if (isActive) {
            btn.classList.add('bg-slate-800', 'text-white', 'border-slate-800');
            btn.classList.remove('bg-white', 'text-slate-600', 'border-slate-200');
        } else {
            btn.classList.remove('bg-slate-800', 'text-white', 'border-slate-800');
            btn.classList.add('bg-white', 'text-slate-600', 'border-slate-200');
        }
    });
    renderTasks();
}

// ---------------------------------------------------------------------------
// Header / Data
// ---------------------------------------------------------------------------
export function setCurrentDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let dateStr = new Date().toLocaleDateString('pt-BR', options).replace('-feira', '');
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    document.getElementById('currentDateDisplay').textContent = dateStr;
}

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------
export function getCategoryColor(cat) {
    return CATEGORY_COLORS[cat] || CATEGORY_COLORS['Geral'];
}

// ---------------------------------------------------------------------------
// Renderização principal
// ---------------------------------------------------------------------------
export function setTasks(taskList) {
    tasks = taskList;
    renderTasks();
}

export function renderTasks() {
    const pendingList = document.getElementById('taskList');
    const completedList = document.getElementById('completedTaskList');
    const emptyState = document.getElementById('emptyTasks');
    const completedContainer = document.getElementById('completedTasksContainer');

    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    const allPending = tasks.filter(t => !t.completed);
    const allCompleted = tasks.filter(t => t.completed);

    const filtered = currentFilter === 'all'
        ? allPending
        : allPending.filter(t => t.category === currentFilter);

    // Empty state
    const isEmpty = filtered.length === 0;
    emptyState.classList.toggle('hidden', !isEmpty);
    emptyState.classList.toggle('flex', isEmpty);
    if (isEmpty) {
        const msg = document.getElementById('emptyStateMsg');
        if (msg) {
            msg.textContent = currentFilter === 'all'
                ? 'Adicione novas tarefas usando a IA.'
                : `Nenhuma tarefa de "${currentFilter}". Use a Adição Mágica!`;
        }
    }

    // Concluídas
    document.getElementById('completedCount').textContent = allCompleted.length;
    completedContainer.classList.toggle('hidden', allCompleted.length === 0);

    // Renderiza cards
    filtered.forEach(task => pendingList.appendChild(createTaskElement(task)));
    allCompleted.forEach(task => completedList.appendChild(createTaskElement(task)));

    // Atualiza badge
    const badge = document.getElementById('pendingBadge');
    if (badge) badge.textContent = allPending.length;

    // Atualiza progress ring
    updateProgressRing(allPending.length, allCompleted.length);

    // Inicializa SortableJS para Drag and Drop mobile-friendly
    if (window.Sortable) {
        if (pendingList._sortable) {
            pendingList._sortable.destroy();
        }
        pendingList._sortable = window.Sortable.create(pendingList, {
            animation: 250,
            delay: 150, // Delay tátil para evitar drag acidental ao rolar a página no celular
            delayOnTouchOnly: true,
            onEnd: async function () {
                await updateOrderInDB(pendingList);
            }
        });
    }
}

function updateProgressRing(pendingCount, completedCount) {
    const total = pendingCount + completedCount;
    const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);
    const ring = document.getElementById('progressRing');
    const pctLabel = document.getElementById('progressPct');
    const pCount = document.getElementById('pendingCount');
    const cCount = document.getElementById('completedTodayCount');

    if (ring) ring.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
    if (pctLabel) pctLabel.textContent = `${pct}%`;
    if (pCount) pCount.textContent = pendingCount;
    if (cCount) cCount.textContent = completedCount;

    if (ring) ring.setAttribute('stroke', pct === 100 ? '#34A853' : '#4285F4');
}

// ---------------------------------------------------------------------------
// Criação de card de tarefa
// ---------------------------------------------------------------------------
export function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task-card-enter bg-white rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md pl-5 ${task.completed ? 'opacity-60' : ''}`;
    
    // Configurando ID da tarefa no card para o SortableJS
    if (!task.completed) {
        div.dataset.id = task.id;
    }

    const accentColor = CATEGORY_ACCENTS[task.category] || CATEGORY_ACCENTS['Geral'];
    const accentBar = `<div class="task-accent" style="background:${accentColor}"></div>`;

    let dateBadge = '';
    if (task.dueDate) {
        const d = new Date(task.dueDate);
        const isLate = !task.completed && d < new Date();
        const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        dateBadge = `<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg ${isLate ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}">
            <i class="${isLate ? 'fas fa-exclamation-circle' : 'far fa-clock'}"></i> ${dateStr}
        </span>`;
    }

    const catBadge = task.category
        ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${getCategoryColor(task.category)}">${task.category}</span>`
        : '';

    const energyMap = {
        'Baixa': { cls: 'energy-low', icon: '🔋' },
        'Média': { cls: 'energy-mid', icon: '⚡' },
        'Alta': { cls: 'energy-high', icon: '🔥' },
    };
    let energyBadge = '';
    if (task.energyLevel && energyMap[task.energyLevel]) {
        const e = energyMap[task.energyLevel];
        energyBadge = `<span class="energy-badge ${e.cls}">${e.icon} ${task.energyLevel}</span>`;
    }

    const subtasks = task.subtasks || [];
    const doneCount = subtasks.filter(s => s.done).length;
    const totalSubs = subtasks.length;
    const subProgress = totalSubs > 0 ? Math.round((doneCount / totalSubs) * 100) : 0;

    let subtasksHTML = '';
    if (totalSubs > 0) {
        const subItems = subtasks.map((st, i) => `
            <div class="flex items-center gap-2.5 py-1.5 group/sub cursor-pointer"
                 onclick="event.stopPropagation(); window.toggleSubtask('${task.id}', ${i})">
                <div class="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all
                    ${st.done ? 'bg-google-blue border-google-blue' : 'border-slate-300 group-hover/sub:border-google-blue'}">
                    ${st.done ? '<i class="fas fa-check text-white" style="font-size:7px"></i>' : ''}
                </div>
                <span class="text-[13px] leading-snug transition-all ${st.done ? 'line-through text-slate-400' : 'text-slate-600'}">
                    ${st.title}
                </span>
            </div>
        `).join('');

        subtasksHTML = `
            <div class="mt-3 pt-3 border-t border-slate-100">
                <div class="flex items-center gap-2 mb-2 cursor-pointer"
                     onclick="event.stopPropagation(); window.toggleSubtaskList('${task.id}')">
                    <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div class="subtask-progress-bar h-full rounded-full ${subProgress === 100 ? 'bg-google-green' : 'bg-google-blue'}"
                             style="width:${subProgress}%"></div>
                    </div>
                    <span class="text-[10px] text-slate-400 font-black shrink-0">${doneCount}/${totalSubs}</span>
                    <i class="fas fa-chevron-down text-[9px] text-slate-300 shrink-0 transition-transform" id="subicon-${task.id}"></i>
                </div>
                <div id="sublist-${task.id}" class="${subProgress === 100 ? 'subtask-list-collapsed' : 'subtask-list-expanded'}">
                    ${subItems}
                </div>
            </div>`;
    }

    div.innerHTML = `
        ${accentBar}
        <div class="p-4">
            <div class="flex items-start gap-3">
                <div class="pt-0.5 shrink-0">
                    <div onclick="window.toggleTask('${task.id}', this)"
                        class="w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300
                        ${task.completed ? 'bg-google-blue border-google-blue' : 'border-slate-300 hover:border-google-blue hover:bg-blue-50'}">
                        ${task.completed ? '<i class="fas fa-check text-white text-[10px]"></i>' : ''}
                    </div>
                </div>
                <div class="flex-1 min-w-0" onclick="window.editTask('${task.id}')">
                    <h4 class="font-semibold text-[15px] leading-snug transition-all ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}">
                        ${task.title}
                    </h4>
                    ${task.description ? `<p class="text-sm text-slate-400 mt-0.5 line-clamp-1">${task.description}</p>` : ''}
                    <div class="flex items-center flex-wrap gap-1.5 mt-2">
                        ${catBadge}
                        ${energyBadge}
                        ${dateBadge}
                    </div>
                    ${subtasksHTML}
                </div>
                <button onclick="event.stopPropagation(); window.deleteTask('${task.id}')"
                    class="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0 -mt-1 -mr-1">
                    <i class="fas fa-trash-alt text-sm"></i>
                </button>
            </div>
        </div>`;

    return div;
}

export function toggleCompleted() {
    const list = document.getElementById('completedTaskList');
    const icon = document.getElementById('completedIcon');
    list.classList.toggle('hidden');
    icon.style.transform = list.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
}

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

// ---------------------------------------------------------------------------
// Persistência da Ordem (SortableJS)
// ---------------------------------------------------------------------------
async function updateOrderInDB(listElement) {
    const { getTasksDB, saveTaskDB } = await import('./db.js');
    const allTasks = await getTasksDB();
    
    const elements = [...listElement.children];
    for (let i = 0; i < elements.length; i++) {
        const id = elements[i].dataset.id;
        const task = allTasks.find(t => t.id === id);
        if (task) {
            task.order = i;
            await saveTaskDB(task);
        }
    }
}