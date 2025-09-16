/**
 * Meu IP Webapp - Script Principal
 * Gerencia a exibição de informações de IP e histórico usando localStorage
 */

// Configurações da API
const API_CONFIG = {
    token: '7e914d5080da7d',
    baseUrl: 'https://ipinfo.io',
    timeout: 10000
};

// Elementos DOM
const elements = {
    currentIp: document.getElementById('currentIp'),
    reverseIp: document.getElementById('reverseIp'),
    provider: document.getElementById('provider'),
    location: document.getElementById('location'),
    historyTableBody: document.getElementById('historyTableBody'),
    refreshBtn: document.getElementById('refreshBtn'),
    copyIpBtn: document.getElementById('copyIpBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Estado da aplicação
let currentIpData = null;
let isLoading = false;

/**
 * Classe para gerenciar o histórico de IPs no localStorage
 */
class IPHistoryManager {
    constructor() {
        this.storageKey = 'ip_history';
        this.maxEntries = 50; // Limitar o histórico para evitar problemas de performance
    }

    /**
     * Recupera o histórico do localStorage
     */
    getHistory() {
        try {
            const history = localStorage.getItem(this.storageKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Erro ao recuperar histórico:', error);
            return [];
        }
    }

    /**
     * Salva o histórico no localStorage
     */
    saveHistory(history) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
        }
    }

    /**
     * Adiciona ou atualiza uma entrada no histórico
     */
    addEntry(ipData) {
        const history = this.getHistory();
        const timestamp = new Date().toISOString();
        
        // Procura se o IP já existe no histórico
        const existingIndex = history.findIndex(entry => entry.ip === ipData.ip);
        
        const newEntry = {
            ip: ipData.ip,
            hostname: ipData.hostname || '—',
            org: ipData.org || '—',
            city: ipData.city || '',
            region: ipData.region || '',
            country: ipData.country || '',
            timestamp: timestamp,
            lastSeen: timestamp
        };

        if (existingIndex !== -1) {
            // Atualiza a entrada existente
            history[existingIndex] = { ...history[existingIndex], ...newEntry };
        } else {
            // Adiciona nova entrada no início
            history.unshift(newEntry);
        }

        // Limita o número de entradas
        if (history.length > this.maxEntries) {
            history.splice(this.maxEntries);
        }

        // Ordena por data mais recente
        history.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

        this.saveHistory(history);
        return history;
    }

    /**
     * Limpa todo o histórico
     */
    clearHistory() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('Erro ao limpar histórico:', error);
        }
    }
}

// Instância do gerenciador de histórico
const historyManager = new IPHistoryManager();

/**
 * Exibe ou oculta o overlay de carregamento
 */
function toggleLoading(show) {
    isLoading = show;
    elements.loadingOverlay.classList.toggle('active', show);
    elements.refreshBtn.disabled = show;
}

/**
 * Formata a data para exibição
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '—';
    }
}

/**
 * Formata a localização para exibição
 */
function formatLocation(ipData) {
    const parts = [];
    
    if (ipData.city) parts.push(ipData.city);
    if (ipData.region) parts.push(ipData.region);
    if (ipData.country) parts.push(ipData.country);
    
    return parts.length > 0 ? parts.join(', ') : '—';
}

/**
 * Busca informações do IP usando a API do ipinfo.io
 */
async function fetchIPInfo() {
    try {
        toggleLoading(true);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        
        const response = await fetch(`${API_CONFIG.baseUrl}/json?token=${API_CONFIG.token}`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Valida se os dados essenciais estão presentes
        if (!data.ip) {
            throw new Error('Dados de IP inválidos recebidos da API');
        }
        
        return data;
        
    } catch (error) {
        console.error('Erro ao buscar informações do IP:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('Timeout: A requisição demorou muito para responder');
        }
        
        throw error;
    } finally {
        toggleLoading(false);
    }
}

/**
 * Atualiza a exibição das informações do IP atual
 */
function updateIPDisplay(ipData) {
    currentIpData = ipData;
    
    // Atualiza IP atual
    elements.currentIp.innerHTML = `<span class="fade-in">${ipData.ip}</span>`;
    
    // Atualiza IP reverso (hostname)
    const hostname = ipData.hostname || '—';
    elements.reverseIp.innerHTML = `<span class="fade-in">${hostname}</span>`;
    
    // Atualiza provedor
    const provider = ipData.org || '—';
    elements.provider.textContent = provider;
    
    // Atualiza localização
    const location = formatLocation(ipData);
    elements.location.textContent = location;
    
    // Habilita o botão de copiar
    elements.copyIpBtn.disabled = false;
}

/**
 * Atualiza a tabela de histórico
 */
function updateHistoryTable() {
    const history = historyManager.getHistory();
    const tbody = elements.historyTableBody;
    
    // Limpa a tabela
    tbody.innerHTML = '';
    
    if (history.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="3">Nenhum histórico encontrado. Atualize a página para começar a registrar.</td>
            </tr>
        `;
        return;
    }
    
    // Adiciona as entradas do histórico
    history.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.style.animationDelay = `${index * 0.1}s`;
        
        row.innerHTML = `
            <td>${formatDate(entry.lastSeen)}</td>
            <td><strong>${entry.ip}</strong></td>
            <td>${entry.org}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Copia o IP atual para a área de transferência
 */
async function copyIPToClipboard() {
    if (!currentIpData || !currentIpData.ip) {
        showNotification('Nenhum IP disponível para copiar', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(currentIpData.ip);
        showNotification('IP copiado para a área de transferência!', 'success');
    } catch (error) {
        console.error('Erro ao copiar IP:', error);
        
        // Fallback para navegadores mais antigos
        try {
            const textArea = document.createElement('textarea');
            textArea.value = currentIpData.ip;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('IP copiado para a área de transferência!', 'success');
        } catch (fallbackError) {
            showNotification('Erro ao copiar IP. Tente selecionar e copiar manualmente.', 'error');
        }
    }
}

/**
 * Exibe uma notificação temporária
 */
function showNotification(message, type = 'info') {
    // Remove notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos inline para a notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '1001',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // Cores baseadas no tipo
    const colors = {
        success: '#059669',
        error: '#dc2626',
        info: '#2563eb'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Anima a entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove após 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * Limpa o histórico de IPs
 */
function clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico de IPs?')) {
        historyManager.clearHistory();
        updateHistoryTable();
        showNotification('Histórico limpo com sucesso!', 'success');
    }
}

/**
 * Carrega e exibe as informações do IP
 */
async function loadIPInfo() {
    try {
        const ipData = await fetchIPInfo();
        
        // Atualiza a exibição
        updateIPDisplay(ipData);
        
        // Adiciona ao histórico
        historyManager.addEntry(ipData);
        
        // Atualiza a tabela de histórico
        updateHistoryTable();
        
        showNotification('Informações atualizadas com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao carregar informações do IP:', error);
        
        // Exibe mensagem de erro amigável
        elements.currentIp.innerHTML = '<span class="error">Erro ao carregar</span>';
        elements.reverseIp.innerHTML = '<span class="error">Erro ao carregar</span>';
        
        showNotification(`Erro: ${error.message}`, 'error');
    }
}

/**
 * Adiciona estilos CSS dinamicamente para notificações
 */
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .error {
            color: var(--danger-color);
            font-weight: 500;
        }
        
        @media (max-width: 480px) {
            .notification {
                right: 10px;
                left: 10px;
                max-width: none;
                transform: translateY(-100%);
            }
            
            .notification.show {
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    // Botão de atualizar
    elements.refreshBtn.addEventListener('click', loadIPInfo);
    
    // Botão de copiar IP
    elements.copyIpBtn.addEventListener('click', copyIPToClipboard);
    
    // Botão de limpar histórico
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Atalhos de teclado
    document.addEventListener('keydown', (event) => {
        // Ctrl/Cmd + R para atualizar
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            if (!isLoading) {
                loadIPInfo();
            }
        }
        
        // Ctrl/Cmd + C para copiar IP (quando não há seleção)
        if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !window.getSelection().toString()) {
            if (currentIpData && currentIpData.ip) {
                event.preventDefault();
                copyIPToClipboard();
            }
        }
    });
    
    // Detecta mudanças de conectividade
    window.addEventListener('online', () => {
        showNotification('Conexão restaurada. Atualizando informações...', 'info');
        setTimeout(loadIPInfo, 1000);
    });
    
    window.addEventListener('offline', () => {
        showNotification('Conexão perdida. Algumas funcionalidades podem não funcionar.', 'error');
    });
}

/**
 * Inicializa a aplicação
 */
async function initApp() {
    try {
        // Adiciona estilos para notificações
        addNotificationStyles();
        
        // Configura event listeners
        setupEventListeners();
        
        // Carrega o histórico existente
        updateHistoryTable();
        
        // Carrega as informações do IP atual
        await loadIPInfo();
        
        console.log('Aplicação inicializada com sucesso');
        
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        showNotification('Erro ao inicializar a aplicação', 'error');
    }
}

// Inicializa quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Exporta funções para uso global (útil para debugging)
window.IPApp = {
    loadIPInfo,
    clearHistory,
    copyIPToClipboard,
    historyManager,
    currentIpData: () => currentIpData
};

