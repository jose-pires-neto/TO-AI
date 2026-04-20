/**
 * config.js — Constantes Globais
 * SRP: Este arquivo só guarda configurações. Nenhuma lógica aqui.
 * Para adicionar uma nova categoria ou mudar o modelo de IA, edite ESTE arquivo.
 */

export const DB_NAME    = 'GoogleTarefasAIDB';
export const DB_VERSION = 3;
export const STORE_NAME = 'tasks_v3';

export const FILE_NAME_DRIVE = 'google_tarefas_ai_backup.json';

/** Mapa de cores por categoria. Adicione novas categorias aqui. */
export const CATEGORY_COLORS = {
    'Trabalho': 'bg-blue-100 text-blue-700',
    'Pessoal':  'bg-purple-100 text-purple-700',
    'Compras':  'bg-emerald-100 text-emerald-700',
    'Geral':    'bg-slate-100 text-slate-700',
};

/**
 * Prompt do sistema para a IA Groq.
 * Atualizado para suportar o campo "subtasks" e "energyLevel" do roadmap.
 */
export const AI_SYSTEM_PROMPT = `Você é o cérebro invisível do novo Google Tarefas (MVP). Seu objetivo é ajudar o usuário a organizar a vida.
REGRAS:
1. Responda SEMPRE E SOMENTE no formato JSON abaixo.
2. O ano é 2026. Hoje é ${new Date().toLocaleDateString('pt-BR')}.
3. O campo dueDate deve ser "YYYY-MM-DDTHH:mm". Se não houver hora, use 09:00.
4. Categorize as tarefas em: "Trabalho", "Pessoal", "Compras", ou "Geral".
5. Se o usuário estiver apenas conversando, deixe "tarefasParaCriar" vazio.
6. Se a tarefa for um projeto complexo, preencha o campo "subtasks".
7. Preencha "energyLevel" com "Baixa", "Média" ou "Alta".

FORMATO JSON ESPERADO:
{
  "respostaTexto": "Sua resposta falada (curta, amigável estilo Google Assistant). Vazio se for apenas criação rápida.",
  "tarefasParaCriar": [
    {
      "title": "Título claro",
      "description": "Detalhes extraídos",
      "dueDate": "YYYY-MM-DDTHH:mm",
      "category": "Pessoal",
      "energyLevel": "Média",
      "subtasks": [
        { "title": "Subtarefa 1", "done": false }
      ]
    }
  ]
}`;
