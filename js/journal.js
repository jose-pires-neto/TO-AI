import { getJournalDB, saveJournalDB } from './db.js';

let quillInstance = null;
let saveTimeout = null;
let currentDateStr = '';

export async function initJournal() {
    // Pegar data local (YYYY-MM-DD) para usar de chave
    const now = new Date();
    currentDateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    // Inicializar o editor Quill se for o primeiro carregamento
    if (!quillInstance) {
        quillInstance = new window.Quill('#quillEditor', {
            theme: 'snow',
            modules: {
                toolbar: '#quillToolbar'
            },
            placeholder: 'Anote pensamentos rápidos, minutas de reunião, resumos ou sentimentos do seu dia...'
        });

        // Configurar o Auto-save (Salva 1 segundo após o usuário parar de digitar)
        quillInstance.on('text-change', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveJournalEntry, 1000);
        });
    }

    // Buscar no IndexedDB o que já foi escrito hoje
    const entry = await getJournalDB(currentDateStr);
    if (entry && entry.content) {
        // Usa root.innerHTML para setar o HTML salvo
        quillInstance.root.innerHTML = entry.content;
    } else {
        // Dia novo, diário em branco
        quillInstance.setText('');
    }
}

/**
 * Função interna que empacota o HTML e salva no IndexedDB via db.js
 */
async function saveJournalEntry() {
    if (!quillInstance) return;
    
    const content = quillInstance.root.innerHTML;
    const textRaw = quillInstance.getText().trim();
    
    // Se só tem a tag vazia padrão do Quill <p><br></p>, guardamos vazio
    const isBlank = textRaw.length === 0;

    await saveJournalDB({
        dateStr: currentDateStr,
        content: isBlank ? '' : content,
        updatedAt: Date.now()
    });
}
