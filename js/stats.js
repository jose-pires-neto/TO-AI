import { getTasksDB } from './db.js';
import { CATEGORY_COLORS } from './config.js';

export async function renderStats() {
    const allTasks = await getTasksDB();
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // Assegura fallback para tarefas concluídas antes dessa feature
    const completedTasks = allTasks.filter(t => t.completed);
    const pendingTasks = allTasks.filter(t => !t.completed);
    
    // Tarefas concluidas hoje
    const completedToday = completedTasks.filter(t => {
        const time = t.completedAt || t.createdAt; // se não tem data de conclusão, tenta a criação
        return time >= startOfToday;
    });

    document.getElementById('statsCompletedToday').textContent = completedToday.length;
    document.getElementById('statsPendingNow').textContent = pendingTasks.length;

    // Calcular balanço de Energia (apenas de tarefas completadas)
    let high = 0, mid = 0, low = 0;
    completedTasks.forEach(t => {
        if (t.energyLevel === 'Alta') high++;
        else if (t.energyLevel === 'Média') mid++;
        else if (t.energyLevel === 'Baixa') low++;
    });

    const totalEnergy = high + mid + low;
    
    document.getElementById('statsHighCount').textContent = high;
    document.getElementById('statsMidCount').textContent = mid;
    document.getElementById('statsLowCount').textContent = low;

    // Animação das barras
    setTimeout(() => {
        document.getElementById('statsHighBar').style.width = totalEnergy ? (high/totalEnergy)*100 + '%' : '0%';
        document.getElementById('statsMidBar').style.width = totalEnergy ? (mid/totalEnergy)*100 + '%' : '0%';
        document.getElementById('statsLowBar').style.width = totalEnergy ? (low/totalEnergy)*100 + '%' : '0%';
    }, 100);

    // Calcular Categorias mais ativas
    const catCounts = {};
    completedTasks.forEach(t => {
        const c = t.category || 'Geral';
        catCounts[c] = (catCounts[c] || 0) + 1;
    });

    const catList = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const listEl = document.getElementById('statsCategoriesList');
    listEl.innerHTML = '';
    
    if (catList.length === 0) {
        listEl.innerHTML = '<p class="text-sm text-slate-400">Nenhuma tarefa concluída ainda.</p>';
    } else {
        catList.forEach(([cat, count]) => {
            const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Geral'];
            listEl.innerHTML += `
                <div class="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full ${colorClass.split(' ')[0]} bg-current border-2 opacity-80"></span>
                        <span class="font-bold text-sm text-slate-700">${cat}</span>
                    </div>
                    <span class="text-sm font-black text-slate-500">${count}</span>
                </div>
            `;
        });
    }
}
