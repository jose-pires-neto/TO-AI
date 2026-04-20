/**
 * db.js — Camada de Dados (IndexedDB)
 * SRP: Toda interação com IndexedDB fica AQUI. Nenhum DOM, nenhuma lógica de UI.
 * OCP: Para trocar de IndexedDB para outro storage, altere apenas este arquivo.
 */

import { DB_NAME, DB_VERSION, STORE_NAME } from './config.js';

/** Instância do banco — inicializada uma vez e reutilizada. */
export let db = null;

/**
 * Abre (ou cria) o banco IndexedDB.
 * Deve ser chamado uma única vez na inicialização da app.
 * @returns {Promise<IDBDatabase>}
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject('Erro ao abrir o IndexedDB');

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

/**
 * Salva (insert ou update) uma tarefa no banco.
 * @param {Object} task
 */
export function saveTaskDB(task) {
    return new Promise((resolve, reject) => {
        const tx    = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(task);
        tx.oncomplete = () => resolve();
        tx.onerror    = () => reject('Erro ao salvar tarefa');
    });
}

/**
 * Retorna todas as tarefas, ordenadas da mais nova para a mais antiga.
 * @returns {Promise<Object[]>}
 */
export function getTasksDB() {
    return new Promise((resolve, reject) => {
        const tx      = db.transaction([STORE_NAME], 'readonly');
        const store   = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () =>
            resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
        request.onerror = () => reject('Erro ao buscar tarefas');
    });
}

/**
 * Remove uma tarefa pelo ID.
 * @param {string} id
 */
export function deleteTaskDB(id) {
    return new Promise((resolve) => {
        const tx    = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
    });
}

/**
 * Apaga TODAS as tarefas (usado pelo restore do Drive).
 */
export function clearAllTasksDB() {
    return new Promise((resolve) => {
        const tx    = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
    });
}
