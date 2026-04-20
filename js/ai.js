/**
 * ai.js — Integração com a IA (Groq)
 * SRP: Toda a lógica de chamada à API e de UI do chat fica aqui.
 * OCP: Para trocar de Groq para outro provider, altere apenas a função fetchGroq().
 */

import { AI_SYSTEM_PROMPT } from './config.js';
import { saveTaskDB, getTasksDB } from './db.js';
import { setTasks, showToast } from './ui.js';
import { switchTab } from './app.js';

/** Histórico de mensagens para manter contexto no chat. */
let apiMessages = [{ role: 'system', content: AI_SYSTEM_PROMPT }];

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

/**
 * Realiza uma chamada à API Groq e retorna o objeto de resposta.
 * @param {Object[]} messages
 * @returns {Promise<Object>}
 */
export async function fetchGroq(messages) {
    const apiKey = localStorage.getItem('groqApiKey');
    if (!apiKey) throw new Error('Chave da API não configurada. Vá em Ajustes.');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:  'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type':  'application/json',
        },
        body: JSON.stringify({
            model:           'llama-3.1-8b-instant',
            messages,
            temperature:     0.1,
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Erro na API Groq');
    }
    return res.json();
}

// ---------------------------------------------------------------------------
// Fluxo 1: Magic Add (criação silenciosa na tela principal)
// ---------------------------------------------------------------------------

async function processMagicAdd() {
    const input  = document.getElementById('magicAddInput');
    const text   = input.value.trim();
    if (!text) return;

    // Fallback offline: sem API key, cria tarefa simples
    if (!localStorage.getItem('groqApiKey')) {
        const newTask = {
            id: Date.now().toString(), title: text, description: '',
            dueDate: null, category: 'Geral', completed: false, createdAt: Date.now(),
        };
        await saveTaskDB(newTask);
        const updated = await getTasksDB();
        setTasks(updated);
        input.value = '';
        showToast('Tarefa criada (Modo Offline)');
        return;
    }

    const loader = document.getElementById('magicAddLoading');
    const btn    = document.getElementById('magicAddBtn');

    input.disabled = true;
    btn.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const prompt = [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            { role: 'user',   content: `Crie a tarefa baseada nisto: "${text}". Mantenha respostaTexto vazio.` },
        ];
        const data   = await fetchGroq(prompt);
        const result = JSON.parse(data.choices[0].message.content);

        if (result.tarefasParaCriar?.length > 0) {
            for (const t of result.tarefasParaCriar) {
                await saveTaskDB({
                    id:          Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    title:       t.title,
                    description: t.description || '',
                    dueDate:     t.dueDate     || null,
                    category:    t.category    || 'Geral',
                    subtasks:    t.subtasks    || [],
                    energyLevel: t.energyLevel || null,
                    completed:   false,
                    createdAt:   Date.now(),
                });
            }
            const updated = await getTasksDB();
            setTasks(updated);
            showToast(`✨ Adição Mágica: ${result.tarefasParaCriar.length} tarefa(s) criada(s)`);
        }
        input.value = '';
    } catch (error) {
        showToast(`Erro: ${error.message}`);
    } finally {
        input.disabled = false;
        btn.classList.remove('hidden');
        loader.classList.add('hidden');
        input.focus();
    }
}

// ---------------------------------------------------------------------------
// Fluxo 2: Chat Assistant
// ---------------------------------------------------------------------------

/**
 * Cria e insere uma bolha de chat no DOM.
 * @param {string} sender
 * @param {string} text
 * @param {'user'|'ai'|'system_ui'|'error'} type
 * @param {string|null} id
 */
export function appendChatUI(sender, text, type, id = null) {
    const chatBox = document.getElementById('chatBox');
    const div     = document.createElement('div');
    if (id) div.id = id;

    div.className = 'flex w-full mb-4';
    const bubble  = document.createElement('div');
    bubble.className = 'chat-bubble text-[15px] p-4 shadow-sm';

    if (type === 'user') {
        div.classList.add('justify-end');
        bubble.className += ' bg-google-blue text-white rounded-[20px] rounded-tr-[4px]';
        bubble.innerHTML  = text;
    } else if (type === 'ai') {
        div.classList.add('justify-start');
        bubble.className += ' bg-white border border-slate-100 text-slate-700 rounded-[20px] rounded-tl-[4px]';
        bubble.innerHTML  = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    } else if (type === 'system_ui') {
        div.classList.add('justify-center');
        div.innerHTML = `<div class="w-full px-8 text-sm">${text}</div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
        return;
    } else {
        div.classList.add('justify-center');
        bubble.className = 'bg-red-50 text-red-600 rounded-2xl text-sm px-4 py-3 font-medium border border-red-100 w-full mx-4';
        bubble.innerHTML = text;
    }

    div.appendChild(bubble);
    chatBox.appendChild(div);
    setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 50);
}

// ---------------------------------------------------------------------------
// Setup: registra event listeners (chamado UMA VEZ pelo main.js)
// ---------------------------------------------------------------------------

/**
 * Inicializa os event listeners do Magic Add.
 */
export function setupMagicAdd() {
    document.getElementById('magicAddBtn').addEventListener('click', processMagicAdd);
    document.getElementById('magicAddInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processMagicAdd();
    });
}

/**
 * Inicializa o event listener do formulário de chat.
 */
export function setupChat() {
    document.getElementById('chatForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const input = document.getElementById('chatInput');
        const text  = input.value.trim();
        if (!text) return;
        input.value = '';
        input.blur();

        if (!localStorage.getItem('groqApiKey')) {
            appendChatUI('Sistema', 'Você precisa configurar a API Key da Groq na aba Ajustes.', 'error');
            setTimeout(() => switchTab('settings'), 2000);
            return;
        }

        apiMessages.push({ role: 'user', content: text });
        appendChatUI('Você', text, 'user');

        const loaderId = 'loader-' + Date.now();
        appendChatUI('Assistente',
            '<div class="flex gap-1"><div class="w-2 h-2 bg-google-blue rounded-full animate-bounce"></div><div class="w-2 h-2 bg-google-red rounded-full animate-bounce" style="animation-delay: 0.1s"></div><div class="w-2 h-2 bg-google-yellow rounded-full animate-bounce" style="animation-delay: 0.2s"></div></div>',
            'ai', loaderId);

        try {
            const data         = await fetchGroq(apiMessages);
            const replyContent = data.choices[0].message.content;
            apiMessages.push({ role: 'assistant', content: replyContent });

            document.getElementById(loaderId)?.remove();
            const responseObj = JSON.parse(replyContent);

            if (responseObj.respostaTexto) {
                appendChatUI('Assistente', responseObj.respostaTexto, 'ai');
            }

            if (responseObj.tarefasParaCriar?.length > 0) {
                for (const t of responseObj.tarefasParaCriar) {
                    await saveTaskDB({
                        id:          Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        title:       t.title,
                        description: t.description || '',
                        dueDate:     t.dueDate     || null,
                        category:    t.category    || 'Geral',
                        subtasks:    t.subtasks    || [],
                        energyLevel: t.energyLevel || null,
                        completed:   false,
                        createdAt:   Date.now(),
                    });
                }
                const updated = await getTasksDB();
                setTasks(updated);
                appendChatUI('Sistema',
                    `<div class="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center text-blue-700 font-medium cursor-pointer hover:bg-blue-100 transition-colors shadow-sm" onclick="window.switchTab('tasks')">
                        <i class="fas fa-check-circle mr-2 text-google-blue"></i> ${responseObj.tarefasParaCriar.length} tarefa(s) criada(s)! Toque para ver.
                    </div>`,
                    'system_ui');
            }
        } catch (error) {
            document.getElementById(loaderId)?.remove();
            appendChatUI('Erro', `<b>Falha na IA:</b><br>${error.message}`, 'error');
            apiMessages.pop();
        }
    });
}
