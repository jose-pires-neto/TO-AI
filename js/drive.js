/**
 * drive.js — Backup Google Drive
 * SRP: Toda a lógica de OAuth e Drive API fica aqui. Zero dependência de UI de tarefas.
 * OCP: Para trocar de Drive para outro serviço de cloud, substitua apenas este arquivo.
 */

import { FILE_NAME_DRIVE } from './config.js';
import { getTasksDB, clearAllTasksDB, saveTaskDB } from './db.js';
import { setTasks, showToast } from './ui.js';

/** Token de acesso OAuth em memória (válido enquanto a page estiver aberta). */
let accessToken = null;

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

/**
 * Obtém (ou reutiliza) o access token OAuth2 do Google.
 * @returns {Promise<string>} access token
 */
function getGoogleToken() {
    return new Promise((resolve, reject) => {
        const clientId = localStorage.getItem('googleClientId');
        if (!clientId) {
            showToast('Configuração: Falta Client ID do Google.');
            reject();
            return;
        }
        if (accessToken) { resolve(accessToken); return; }

        try {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.appdata',
                callback: (resp) => {
                    if (resp?.access_token) {
                        accessToken = resp.access_token;
                        resolve(accessToken);
                    } else {
                        reject('Erro na autenticação Google.');
                    }
                },
            });
            client.requestAccessToken();
        } catch (e) {
            showToast('Erro no Google Cloud. Verifique o Client ID.');
            reject(e);
        }
    });
}

// ---------------------------------------------------------------------------
// Drive API Helpers
// ---------------------------------------------------------------------------

/**
 * Busca o ID do arquivo de backup no appDataFolder do Drive.
 * @param {string} token
 * @returns {Promise<string|null>}
 */
async function findBackupFileId(token) {
    // 1. Montamos a query isolada e encodamos os caracteres (como as aspas simples)
    const query = encodeURIComponent(`name='${FILE_NAME_DRIVE}'`);

    // 2. Passamos a query e o parâmetro spaces corretamente separados
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=appDataFolder&fields=files(id,name)`;

    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

    if (!res.ok) {
        // Se der erro 400 ou outro, vai avisar no console de forma mais clara
        console.error('Erro ao buscar ID do backup:', await res.text());
        return null;
    }

    const data = await res.json();
    return data.files?.length > 0 ? data.files[0].id : null;
}

// ---------------------------------------------------------------------------
// Operações Públicas
// ---------------------------------------------------------------------------

/**
 * Serializa todas as tarefas e faz upload para o Google Drive (appDataFolder).
 * Cria o arquivo se não existir, ou sobrescreve se já existir.
 */
export async function backupToDrive() {
    try {
        showToast('Sincronizando com a nuvem...');
        const token = await getGoogleToken();
        const allTasks = await getTasksDB();
        const fileContent = JSON.stringify(allTasks);
        const fileId = await findBackupFileId(token);

        const metadata = {
            name: FILE_NAME_DRIVE,
            mimeType: 'application/json',
            ...(fileId ? {} : { parents: ['appDataFolder'] }),
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        const url = fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const method = fileId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: form,
        });

        if (res.ok) {
            showToast('Backup salvo na nuvem com sucesso!');
            document.getElementById('syncStatus').innerHTML =
                '<i class="fas fa-cloud-check text-google-green"></i> Sincronizado';
        } else {
            throw new Error('Erro na API do Drive');
        }
    } catch (e) {
        if (e) console.error('[drive.js] backupToDrive:', e);
    }
}

/**
 * Baixa o backup do Google Drive e substitui as tarefas locais.
 */
export async function restoreFromDrive() {
    try {
        showToast('Buscando backup na nuvem...');
        const token = await getGoogleToken();
        const fileId = await findBackupFileId(token);

        if (!fileId) { showToast('Nenhum backup encontrado.'); return; }

        const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Erro ao baixar o arquivo de backup');

        const cloudTasks = await res.json();
        await clearAllTasksDB();
        for (const task of cloudTasks) await saveTaskDB(task);

        const updated = await getTasksDB();
        setTasks(updated);

        showToast('Dados restaurados com sucesso!');
        document.getElementById('syncStatus').innerHTML =
            '<i class="fas fa-cloud-check text-google-green"></i> Sincronizado';

        // Importação dinâmica para evitar dependência circular com app.js
        const { switchTab } = await import('./app.js');
        switchTab('tasks');
    } catch (e) {
        if (e) console.error('[drive.js] restoreFromDrive:', e);
    }
}
