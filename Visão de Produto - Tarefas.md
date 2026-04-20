# **🚀 Visão de Produto: O Novo Google Tarefas IA**

**Documento de Estratégia e Roadmap para o Hackathon**

Para revolucionar o mercado e mostrar o verdadeiro poder do ecossistema Google, o nosso MVP deve evoluir de uma "lista de tarefas passiva" para um **Agente de Produtividade Proativo**. A IA não deve apenas registrar o que o usuário pede, ela deve *pensar* pelo usuário.

Abaixo estão as "Killer Features" separadas por pilares estratégicos para implementar e focar no pitch.

## **🧠 Pilar 1: Inteligência Estrutural (Decomposição)**

A maior dor dos usuários é a procrastinação causada por tarefas muito grandes. A IA resolve isso.

### **1\. Quebra Automática de Tarefas (Auto-Breakdown)**

* **O que é:** Quando o usuário digita "Organizar festa de aniversário do João", a IA detecta que é um "Projeto" e não uma tarefa simples.  
* **Ação da IA:** Ela automaticamente sugere e cria subtarefas:  
  * *Subtarefa 1:* Fazer lista de convidados (Para hoje).  
  * *Subtarefa 2:* Encomendar o bolo (Para daqui a 3 dias).  
  * *Subtarefa 3:* Comprar decoração.  
* **Como fazer no MVP:** Alterar o prompt do Groq para, se a tarefa for complexa, retornar um array populado no campo subtasks e exibi-las embaixo da tarefa principal com uma barra de progresso.

### **2\. Estimativa de Esforço Dinâmico**

* **O que é:** A IA atribui um "peso" (em minutos/horas ou energia "Baixa/Média/Alta") para cada tarefa criada.  
* **Ação da IA:** Ela avisa: "Sua lista de hoje tem 12 horas estimadas de esforço. Quer que eu mova as tarefas de energia baixa para amanhã?".

## **🌐 Pilar 2: Contexto Profundo (Ecossistema Google)**

O diferencial do Google é saber onde você está, quem você é e o que está no seu email. A IA do Tarefas precisa simular isso.

### **3\. Smart Triggers (Gatilhos de Contexto)**

* **Integração Maps:** Tarefas disparadas por localização. (Ex: O usuário pede "Lembrar de comprar pilhas". A IA usa o *Geofencing* e envia um push apenas quando o usuário passar perto de um supermercado).  
* **Integração Agenda:** "Preparar relatório da reunião". A IA olha a agenda, vê que a reunião é às 14h, e bloqueia um tempo na agenda às 10h para o preparo.  
* **No Pitch:** Mostre como o Workspace interage com a sua IA.

## **🔮 Pilar 3: Agência Proativa (Zero-UI)**

A melhor interface é aquela que você quase não precisa usar.

### **4\. O "Briefing" Diário (Daily Triage)**

* **O que é:** Todo dia às 08:00, o app não mostra apenas a lista. Ele abre com um card da Assistente gerado dinamicamente:  
  * *"Bom dia\! Vi que você tem 3 reuniões hoje à tarde. Reagendei suas tarefas de foco profundo para amanhã de manhã. Você só tem 2 tarefas rápidas para hoje. Parece bom?"*  
* **Botão de 1 Clique:** "Aprovar organização da IA".

### **5\. Resolução Ativa de Tarefas**

* **O que é:** A IA não só anota, ela *tenta resolver*.  
* **Exemplo:** Tarefa "Comprar presente para minha mãe". A IA já embute um botão com 3 links do Google Shopping baseados no perfil dela. Tarefa "Marcar médico", a IA sugere horários usando a API de buscas.

## **🛠️ Plano de Ação Imediato para o Código (MVP Nível 2\)**

Para colocar isso no código que já temos (antes de entregar), sugiro implementarmos **3 coisas cruciais** no prompt do Groq e no frontend:

1. **Refatorar o Prompt (JSON):** Ensinar a IA a devolver subtasks de forma consistente.  
2. **UI de Subtarefas:** Criar um acordeão no HTML para mostrar as subtarefas aninhadas.  
3. **Botão "Auto-Organizar Meu Dia":** Um botão na tela inicial que pega a lista atual de tarefas pendentes, manda tudo de uma vez para a IA, e a IA retorna as tarefas reorganizadas, priorizadas e com subtarefas criadas onde for necessário.

### **Exemplo do Novo JSON a ser exigido da IA:**

{  
  "respostaTexto": "Quebrei a tarefa de mudar de casa em 4 etapas menores para você não se estressar.",  
  "tarefasParaCriar": \[  
    {  
      "title": "Mudar de Casa",  
      "description": "Projeto principal",  
      "category": "Pessoal",  
      "dueDate": "2026-05-10T09:00",  
      "energyLevel": "Alto",  
      "subtasks": \[  
        { "title": "Comprar caixas de papelão", "done": false },  
        { "title": "Contratar frete", "done": false },  
        { "title": "Empacotar sala", "done": false }  
      \]  
    }  
  \]  
}