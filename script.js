/**
 * Meu IP PWA - Script Principal
 * Gerencia a exibição de informações de IP, histórico e funcionalidades PWA
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
let serviceWorkerRegistration = null;

/**
 * Registra o Service Worker para funcionalidades PWA
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registrado com sucesso:', serviceWorkerRegistration);
            
            // Escuta atualizações do Service Worker
            serviceWorkerRegistration.addEventListener('updatefound', () => {
                const newWorker = serviceWorkerRegistration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
            
            // Escuta mensagens do Service Worker
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
            
            return serviceWorkerRegistration;
            
        } catch (error) {
            console.error('Erro ao registrar Service Worker:', error);
            return null;
        }
    }
    return null;
}

/**
 * Manipula mensagens recebidas do Service Worker
 */
function handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
        case 'IP_UPDATE':
            if (data && data.ip !== currentIpData?.ip) {
                showIPChangeNotification(data);
            }
            break;
        case 'VERSION':
            console.log('Versão do Service Worker:', data.version);
            break;
        case 'CACHE_CLEARED':
            if (data.success) {
                showNotification('Cache limpo com sucesso!', 'success');
            } else {
                showNotification('Erro ao limpar cache', 'error');
            }
            break;
    }
}

/**
 * Mostra notificação de atualização disponível
 */
function showUpdateNotification() {
    if (confirm('Uma nova versão está disponível. Deseja atualizar?')) {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }
}

/**
 * Mostra notificação de mudança de IP
 */
function showIPChangeNotification(newData) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('IP Alterado!', {
            body: `Seu novo IP é: ${newData.ip}`,
            icon: '/icon-192x192.png',
            tag: 'ip-change',
            requireInteraction: false
        });
    }
    
    showNotification(`IP alterado para: ${newData.ip}`, 'info');
}

/**
 * Solicita permissão para notificações
 */
async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                showNotification('Notificações ativadas!', 'success');
                return true;
            }
        } catch (error) {
            console.error('Erro ao solicitar permissão para notificações:', error);
        }
    }
    return false;
}

/**
 * Classe para gerenciar o histórico de IPs no localStorage
 */
class IPHistoryManager {
    constructor() {
        this.storageKey = 'ip_history';
        this.maxEntries = 50;
    }

    getHistory() {
        try {
            const history = localStorage.getItem(this.storageKey);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Erro ao recuperar histórico:', error);
            return [];
        }
    }

    saveHistory(history) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
        }
    }

    addEntry(ipData) {
        const history = this.getHistory();
        const timestamp = new Date().toISOString();
        
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
            history[existingIndex] = { ...history[existingIndex], ...newEntry };
        } else {
            history.unshift(newEntry);
        }

        if (history.length > this.maxEntries) {
            history.splice(this.maxEntries);
        }

        history.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));

        this.saveHistory(history);
        return history;
    }

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
    
    if (show) {
        elements.refreshBtn.innerHTML = '⏳ Carregando...';
    } else {
        elements.refreshBtn.innerHTML = '🔄 Atualizar IP';
    }
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
    
    tbody.innerHTML = '';
    
    if (history.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="3">Nenhum histórico encontrado. Atualize a página para começar a registrar.</td>
            </tr>
        `;
        return;
    }
    
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
        
        // Feedback visual no botão
        const originalText = elements.copyIpBtn.innerHTML;
        elements.copyIpBtn.innerHTML = '✅ Copiado!';
        elements.copyIpBtn.disabled = true;
        
        setTimeout(() => {
            elements.copyIpBtn.innerHTML = originalText;
            elements.copyIpBtn.disabled = false;
        }, 2000);
        
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
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        zIndex: '10001',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        maxWidth: '320px',
        wordWrap: 'break-word',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)'
    });
    
    const colors = {
        success: 'linear-gradient(135deg, #10b981, #059669)',
        error: 'linear-gradient(135deg, #ef4444, #dc2626)',
        info: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        warning: 'linear-gradient(135deg, #f59e0b, #d97706)'
    };
    
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 4000);
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
        
        updateIPDisplay(ipData);
        historyManager.addEntry(ipData);
        updateHistoryTable();
        
        // Envia dados para o Service Worker
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_IP_DATA',
                data: ipData
            });
        }
        
        showNotification('Informações atualizadas com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao carregar informações do IP:', error);
        
        elements.currentIp.innerHTML = '<span class="error">Erro ao carregar</span>';
        elements.reverseIp.innerHTML = '<span class="error">Erro ao carregar</span>';
        
        showNotification(`Erro: ${error.message}`, 'error');
    }
}

/**
 * Verifica mudanças de IP periodicamente
 */
async function checkIPChange() {
    if (isLoading || !navigator.onLine) return;
    
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/ip?token=${API_CONFIG.token}`);
        const ip = await response.text();
        
        if (currentIpData && currentIpData.ip !== ip) {
            showNotification(`IP alterado para: ${ip}`, 'info');
            await loadIPInfo();
        }
    } catch (error) {
        console.log('Erro na verificação silenciosa de IP:', error);
    }
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
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            if (!isLoading) {
                loadIPInfo();
            }
        }
        
        if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !window.getSelection().toString()) {
            if (currentIpData && currentIpData.ip) {
                event.preventDefault();
                copyIPToClipboard();
            }
        }
    });
    
    // Detecta mudanças de conectividade
    window.addEventListener('online', () => {
        showNotification('Conexão restaurada!', 'success');
        setTimeout(loadIPInfo, 1000);
    });
    
    window.addEventListener('offline', () => {
        showNotification('Você está offline', 'warning');
    });
    
    // Detecta quando a aba fica visível novamente
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.onLine) {
            setTimeout(checkIPChange, 1000);
        }
    });
}

/**
 * Adiciona estilos CSS dinamicamente
 */
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(10px);
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
 * Inicializa a aplicação
 */
async function initApp() {
    try {
        console.log('🌐 Meu IP PWA - Iniciando aplicação...');
        
        // Registra o Service Worker
        await registerServiceWorker();
        
        // Solicita permissão para notificações
        await requestNotificationPermission();
        
        // Adiciona estilos dinâmicos
        addDynamicStyles();
        
        // Configura event listeners
        setupEventListeners();
        
        // Carrega o histórico existente
        updateHistoryTable();
        
        // Carrega as informações do IP atual
        await loadIPInfo();
        
        // Configura verificação periódica de mudança de IP
        setInterval(checkIPChange, 5 * 60 * 1000); // A cada 5 minutos
        
        console.log('✅ Aplicação PWA inicializada com sucesso!');
        
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
    currentIpData: () => currentIpData,
    serviceWorkerRegistration: () => serviceWorkerRegistration
};

console.log('📱 Meu IP PWA - Script carregado!');

