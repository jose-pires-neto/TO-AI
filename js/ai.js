/**
 * ai.js — Integração com a IA (Groq)
 * SRP: Toda a lógica de chamada à API e de UI do chat/assistência fica aqui.
 */

import { AI_SYSTEM_PROMPT, AI_AUTO_ORGANIZE_PROMPT } from './config.js';
import { saveTaskDB, getTasksDB, deleteTaskDB } from './db.js';
import { setTasks, showToast, showAIProposalCard, hideAIProposalCard } from './ui.js';
import { switchTab } from './app.js';

let apiMessages = [{ role: 'system', content: AI_SYSTEM_PROMPT }];

/** * Armazena a proposta atual da IA (Triagem Diária) aguardando aprovação 
 */
let pendingAIProposal = null;
let originalPendingTasks = [];

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------
export async function fetchGroq(messages) {
    const apiKey = localStorage.getItem('groqApiKey');
    if (!apiKey) throw new Error('Chave da API não configurada.');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages,
            temperature: 0.2,
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
// Fluxo: Magic Add
// ---------------------------------------------------------------------------
async function processMagicAdd() {
    const input = document.getElementById('magicAddInput');
    const text = input.value.trim();
    if (!text) return;

    if (!localStorage.getItem('groqApiKey')) {
        const newTask = {
            id: Date.now().toString(), title: text, description: '',
            dueDate: null, category: 'Geral', completed: false,
            subtasks: [], energyLevel: null, createdAt: Date.now(),
        };
        await saveTaskDB(newTask);
        const updated = await getTasksDB();
        setTasks(updated);
        input.value = '';
        showToast('Tarefa criada (Modo Offline)');
        return;
    }

    const loader = document.getElementById('magicAddLoading');
    const btn = document.getElementById('magicAddBtn');

    input.disabled = true;
    btn.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const prompt = [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            { role: 'user', content: `Crie a tarefa baseada nisto: "${text}". Mantenha respostaTexto vazio.` },
        ];
        const data = await fetchGroq(prompt);
        const result = JSON.parse(data.choices[0].message.content);

        if (result.tarefasParaCriar?.length > 0) {
            for (const t of result.tarefasParaCriar) {
                await saveTaskDB({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    title: t.title,
                    description: t.description || '',
                    dueDate: t.dueDate || null,
                    category: t.category || 'Geral',
                    subtasks: t.subtasks || [],
                    energyLevel: t.energyLevel || null,
                    completed: false,
                    createdAt: Date.now(),
                });
            }
            const updated = await getTasksDB();
            setTasks(updated);
            showToast(`✨ ${result.tarefasParaCriar.length} tarefa(s) criada(s)`);
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
// Fluxo: Triagem Diária / Auto-Organizar (Com Validação Humana)
// ---------------------------------------------------------------------------

/**
 * Dispara a IA para analisar a lista, mas NÃO salva no banco.
 * Apresenta o Card de Proposta para o usuário.
 * @param {boolean} isSilent - Se true, não mostra erro se não tiver tasks (usado no load do app)
 */
export async function autoOrganizeDay(isSilent = false) {
    if (!localStorage.getItem('groqApiKey')) {
        if (!isSilent) {
            showToast('Configure a API Key da Groq em Ajustes primeiro.');
            setTimeout(() => switchTab('settings'), 2000);
        }
        return;
    }

    const allTasks = await getTasksDB();
    const pendingTasks = allTasks.filter(t => !t.completed);
    originalPendingTasks = pendingTasks; // Salva para aplicar depois

    // Evita rodar se não tiver quase nada pra organizar
    if (pendingTasks.length === 0) {
        if (!isSilent) showToast('Nenhuma tarefa pendente para organizar! 🎉');
        return;
    }

    const btn = document.getElementById('autoOrganizeBtn');
    const loader = document.getElementById('autoOrganizeLoader');
    const btnText = document.getElementById('autoOrganizeBtnText');

    if (btn && !isSilent) {
        btn.disabled = true;
        btnText.textContent = 'Pensando...';
        loader.classList.remove('hidden');
    }

    try {
        const tasksForAI = pendingTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            category: t.category
        }));

        const prompt = [
            { role: 'system', content: AI_AUTO_ORGANIZE_PROMPT },
            { role: 'user', content: `Analise estas tarefas e proponha melhorias (subtasks, nível de energia): ${JSON.stringify(tasksForAI)}` },
        ];

        const data = await fetchGroq(prompt);
        const result = JSON.parse(data.choices[0].message.content);

        // Se a IA achar que tem coisas pra atualizar, mostra a proposta
        if (result.tarefasAtualizadas?.length > 0) {
            pendingAIProposal = result.tarefasAtualizadas;
            const message = result.respostaTexto || 'Analisei sua lista e fiz algumas otimizações de esforço e quebra de tarefas complexas. Posso aplicar?';

            // Marca no LocalStorage que já fez a triagem hoje
            localStorage.setItem('lastBriefingDate', new Date().toLocaleDateString('pt-BR'));

            showAIProposalCard(message);
            if (!isSilent) showToast('A Assistente gerou uma sugestão!');
        } else {
            if (!isSilent) showToast('A IA analisou e achou que sua lista já está perfeita! ✨');
            // Salva a data para não tentar de novo no mesmo dia à toa
            localStorage.setItem('lastBriefingDate', new Date().toLocaleDateString('pt-BR'));
        }
    } catch (error) {
        if (!isSilent) showToast(`Erro ao organizar: ${error.message}`);
    } finally {
        if (btn && !isSilent) {
            btn.disabled = false;
            btnText.textContent = 'Auto-Organizar Dia';
            loader.classList.add('hidden');
        }
    }
}

/**
 * Função acionada pelo botão "Aplicar" do Card de Proposta
 */
export async function approveAIProposal() {
    if (!pendingAIProposal) return;

    let updatedCount = 0;

    // Atualiza as tarefas no banco usando a proposta salva
    for (const updated of pendingAIProposal) {
        const existing = originalPendingTasks.find(t => t.id === updated.id);
        if (!existing) continue;

        await saveTaskDB({
            ...existing,
            energyLevel: updated.energyLevel || existing.energyLevel || null,
            subtasks: (updated.subtasks?.length > 0)
                ? updated.subtasks
                : (existing.subtasks || []),
        });
        updatedCount++;
    }

    const final = await getTasksDB();
    setTasks(final);

    hideAIProposalCard();
    pendingAIProposal = null;
    originalPendingTasks = [];

    showToast(`✨ Legal! ${updatedCount} tarefa(s) foram otimizadas.`);
}

/**
 * Função acionada pelo botão "Agora não" do Card de Proposta
 */
export function discardAIProposal() {
    hideAIProposalCard();
    pendingAIProposal = null;
    originalPendingTasks = [];
}

/**
 * Verifica se já fez a triagem automática hoje, se não, faz.
 * É chamado na inicialização do app.
 */
export function checkDailyBriefing() {
    const lastBriefing = localStorage.getItem('lastBriefingDate');
    const today = new Date().toLocaleDateString('pt-BR');

    if (lastBriefing !== today) {
        // Roda a organização de forma silenciosa. Se tiver sugestão, o Card vai aparecer.
        autoOrganizeDay(true);
    }
}

// ---------------------------------------------------------------------------
// Fluxo: Chat Assistant
// ---------------------------------------------------------------------------
export function appendChatUI(sender, text, type, id = null) {
    const chatBox = document.getElementById('chatBox');
    const div = document.createElement('div');
    if (id) div.id = id;

    div.className = 'flex w-full mb-4';
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble text-[15px] p-4 shadow-sm';

    if (type === 'user') {
        div.classList.add('justify-end');
        bubble.className += ' bg-google-blue text-white rounded-[20px] rounded-tr-[4px]';
        bubble.innerHTML = text;
    } else if (type === 'ai') {
        div.classList.add('justify-start');
        bubble.className += ' bg-white border border-slate-100 text-slate-700 rounded-[20px] rounded-tl-[4px]';
        bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
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

export function setupMagicAdd() {
    document.getElementById('magicAddBtn').addEventListener('click', processMagicAdd);
    document.getElementById('magicAddInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processMagicAdd();
    });
}

export function setupChat() {
    document.getElementById('chatForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const input = document.getElementById('chatInput');
        const text = input.value.trim();
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
            '<div class="flex gap-1"><div class="w-2 h-2 bg-google-blue rounded-full animate-bounce"></div><div class="w-2 h-2 bg-google-red rounded-full animate-bounce" style="animation-delay:0.1s"></div><div class="w-2 h-2 bg-google-yellow rounded-full animate-bounce" style="animation-delay:0.2s"></div></div>',
            'ai', loaderId);

        try {
            // Prepara o contexto com as tarefas atuais pendentes
            const allTasks = await getTasksDB();
            const pendingTasks = allTasks.filter(t => !t.completed).map(t => ({
                id: t.id,
                title: t.title,
                energyLevel: t.energyLevel,
                category: t.category
            }));
            const contextMsg = `CONTEXTO ATUAL (Lista de tarefas pendentes): ${JSON.stringify(pendingTasks)}\n\nPERGUNTA DO USUÁRIO: ${text}`;
            
            // Cria um array de mensagens temporário para esta chamada para não poluir o histórico com o contexto repetido
            const messagesForAPI = [...apiMessages];
            messagesForAPI[messagesForAPI.length - 1] = { role: 'user', content: contextMsg };

            const data = await fetchGroq(messagesForAPI);
            const replyContent = data.choices[0].message.content;
            apiMessages.push({ role: 'assistant', content: replyContent });

            document.getElementById(loaderId)?.remove();
            const responseObj = JSON.parse(replyContent);

            let hasUpdates = false;

            if (responseObj.respostaTexto) {
                appendChatUI('Assistente', responseObj.respostaTexto, 'ai');
            }

            if (responseObj.tarefasParaCriar?.length > 0) {
                for (const t of responseObj.tarefasParaCriar) {
                    await saveTaskDB({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        title: t.title,
                        description: t.description || '',
                        dueDate: t.dueDate || null,
                        category: t.category || 'Geral',
                        subtasks: t.subtasks || [],
                        energyLevel: t.energyLevel || null,
                        completed: false,
                        createdAt: Date.now(),
                    });
                }
                hasUpdates = true;
                appendChatUI('Sistema',
                    `<div class="bg-blue-50 border border-blue-100 p-3 rounded-2xl text-center text-blue-700 font-medium cursor-pointer hover:bg-blue-100 transition-colors shadow-sm" onclick="window.switchTab('tasks')">
                        <i class="fas fa-check-circle mr-2 text-google-blue"></i> ${responseObj.tarefasParaCriar.length} tarefa(s) criada(s)! Toque para ver.
                    </div>`,
                    'system_ui');
            }

            if (responseObj.tarefasParaAtualizar?.length > 0) {
                const dbAll = await getTasksDB();
                for (const t of responseObj.tarefasParaAtualizar) {
                    const idx = dbAll.findIndex(x => x.id === t.id);
                    if (idx > -1) {
                        dbAll[idx] = { ...dbAll[idx], ...t };
                        await saveTaskDB(dbAll[idx]);
                    }
                }
                hasUpdates = true;
            }

            if (responseObj.tarefasParaDeletar?.length > 0) {
                for (const id of responseObj.tarefasParaDeletar) {
                    await deleteTaskDB(id);
                }
                hasUpdates = true;
            }

            if (hasUpdates) {
                const finalUpdated = await getTasksDB();
                setTasks(finalUpdated);
            }

            if (responseObj.tarefasParaExibirComBotoes?.length > 0) {
                let html = '<div class="mt-2 space-y-2">';
                for (const t of responseObj.tarefasParaExibirComBotoes) {
                    html += `
                        <div class="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                            <span class="text-sm font-semibold text-slate-700 truncate mr-2">${t.title}</span>
                            <button type="button" onclick="window.toggleTask('${t.id}', this)" class="shrink-0 bg-slate-50 border border-slate-200 text-slate-500 hover:text-google-green text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    `;
                }
                html += '</div>';
                appendChatUI('Assistente', html, 'system_ui');
            }

        } catch (error) {
            document.getElementById(loaderId)?.remove();
            appendChatUI('Erro', `<b>Falha na IA:</b><br>${error.message}`, 'error');
            apiMessages.pop();
        }
    });
}