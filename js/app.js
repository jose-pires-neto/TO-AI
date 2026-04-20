/**
 * app.js — Navegação e Configurações
 * SRP: Navegação entre tabs e persistência de settings no localStorage.
 * Este módulo NÃO sabe nada sobre tarefas, IA ou Drive.
 */

import { showToast } from './ui.js';

// ---------------------------------------------------------------------------
// Navegação
// ---------------------------------------------------------------------------

/**
 * Alterna entre as views da aplicação (tasks | ai | settings).
 * @param {'tasks'|'ai'|'settings'} tabId
 */
export function switchTab(tabId) {
    // Esconde todas as views
    document.getElementById('viewTasks').classList.add('hidden');
    document.getElementById('viewAI').classList.add('hidden', 'flex');
    document.getElementById('viewAI').classList.remove('flex');
    document.getElementById('viewSettings').classList.add('hidden');

    // Reset dos botões de navegação
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.replace('text-google-blue', 'text-slate-400');
        btn.querySelector('.nav-indicator').classList.replace('bg-blue-100', 'bg-blue-100/0');
    });

    // Ativa o botão da tab atual
    const activeBtn = document.getElementById('tab-' + tabId);
    activeBtn.classList.replace('text-slate-400', 'text-google-blue');
    activeBtn.querySelector('.nav-indicator').classList.replace('bg-blue-100/0', 'bg-blue-100');

    // Exibe a view correspondente
    if (tabId === 'tasks') {
        document.getElementById('viewTasks').classList.remove('hidden');
        document.getElementById('headerTitle').textContent = 'Tarefas IA';

    } else if (tabId === 'ai') {
        const viewAI = document.getElementById('viewAI');
        viewAI.classList.remove('hidden');
        viewAI.classList.add('flex');
        document.getElementById('headerTitle').textContent = 'Assistente';
        setTimeout(() => {
            const chatBox = document.getElementById('chatBox');
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 100);

    } else if (tabId === 'settings') {
        document.getElementById('viewSettings').classList.remove('hidden');
        document.getElementById('headerTitle').textContent = 'Ajustes';
        // Preenche os campos com os valores salvos
        document.getElementById('groqKeyInput').value        = localStorage.getItem('groqApiKey')     || '';
        document.getElementById('googleClientIdInput').value = localStorage.getItem('googleClientId') || '';
    }
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

/**
 * Lê os inputs de configuração e persiste no localStorage.
 */
export function saveSettings() {
    const groqKey  = document.getElementById('groqKeyInput').value.trim();
    const clientId = document.getElementById('googleClientIdInput').value.trim();
    if (groqKey)  localStorage.setItem('groqApiKey',      groqKey);
    if (clientId) localStorage.setItem('googleClientId',  clientId);
    showToast('Configurações salvas. Tudo pronto!');
}
