// Service Worker para Meu IP PWA
const CACHE_NAME = 'meu-ip-v1.0.0';
const STATIC_CACHE_NAME = 'meu-ip-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'meu-ip-dynamic-v1.0.0';

// Arquivos para cache estático (sempre em cache)
const STATIC_FILES = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Arquivos para cache dinâmico (cache conforme uso)
const DYNAMIC_FILES = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// URLs que devem sempre buscar da rede (API calls)
const NETWORK_ONLY = [
    'https://ipinfo.io'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Instalando Service Worker...');
    
    event.waitUntil(
        Promise.all([
            // Cache estático
            caches.open(STATIC_CACHE_NAME).then(cache => {
                console.log('[SW] Fazendo cache dos arquivos estáticos...');
                return cache.addAll(STATIC_FILES);
            }),
            // Pular waiting para ativar imediatamente
            self.skipWaiting()
        ])
    );
});

// Ativar Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Ativando Service Worker...');
    
    event.waitUntil(
        Promise.all([
            // Limpar caches antigos
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('[SW] Removendo cache antigo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Tomar controle de todas as abas
            self.clients.claim()
        ])
    );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorar requisições não-HTTP
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Estratégia para diferentes tipos de requisições
    if (isStaticAsset(request.url)) {
        // Cache First para arquivos estáticos
        event.respondWith(cacheFirst(request));
    } else if (isAPICall(request.url)) {
        // Network First para chamadas de API
        event.respondWith(networkFirst(request));
    } else if (isDynamicAsset(request.url)) {
        // Stale While Revalidate para recursos dinâmicos
        event.respondWith(staleWhileRevalidate(request));
    } else {
        // Cache First como fallback
        event.respondWith(cacheFirst(request));
    }
});

// Estratégia Cache First
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Adicionar ao cache se a resposta for válida
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Erro em Cache First:', error);
        
        // Fallback para página offline se disponível
        if (request.destination === 'document') {
            const offlinePage = await caches.match('/offline.html');
            if (offlinePage) {
                return offlinePage;
            }
        }
        
        throw error;
    }
}

// Estratégia Network First
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Adicionar ao cache dinâmico se a resposta for válida
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Erro na rede, tentando cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Estratégia Stale While Revalidate
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Buscar da rede em background
    const networkResponsePromise = fetch(request).then(response => {
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(error => {
        console.log('[SW] Erro na rede para Stale While Revalidate:', error);
    });
    
    // Retornar cache imediatamente se disponível, senão aguardar rede
    return cachedResponse || networkResponsePromise;
}

// Verificar se é um arquivo estático
function isStaticAsset(url) {
    return STATIC_FILES.some(file => url.includes(file)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.png') ||
           url.includes('.jpg') ||
           url.includes('.jpeg') ||
           url.includes('.svg') ||
           url.includes('.ico') ||
           url.includes('.woff') ||
           url.includes('.woff2');
}

// Verificar se é uma chamada de API
function isAPICall(url) {
    return NETWORK_ONLY.some(apiUrl => url.includes(apiUrl)) ||
           url.includes('api/') ||
           url.includes('ipinfo.io');
}

// Verificar se é um recurso dinâmico
function isDynamicAsset(url) {
    return DYNAMIC_FILES.some(file => url.includes(file)) ||
           url.includes('fonts.googleapis.com') ||
           url.includes('fonts.gstatic.com');
}

// Manipular mensagens do cliente
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                type: 'VERSION',
                version: CACHE_NAME
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({
                    type: 'CACHE_CLEARED',
                    success: true
                });
            }).catch(error => {
                event.ports[0].postMessage({
                    type: 'CACHE_CLEARED',
                    success: false,
                    error: error.message
                });
            });
            break;
            
        case 'CACHE_IP_DATA':
            // Cache específico para dados de IP
            if (data && data.ip) {
                cacheIPData(data);
            }
            break;
    }
});

// Função para limpar todos os caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

// Cache específico para dados de IP
async function cacheIPData(ipData) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const response = new Response(JSON.stringify(ipData), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'max-age=300' // 5 minutos
            }
        });
        
        await cache.put(`/ip-data/${ipData.ip}`, response);
        console.log('[SW] Dados de IP cacheados:', ipData.ip);
    } catch (error) {
        console.error('[SW] Erro ao cachear dados de IP:', error);
    }
}

// Notificações Push (para futuras implementações)
self.addEventListener('push', event => {
    if (!event.data) {
        return;
    }
    
    const data = event.data.json();
    const options = {
        body: data.body || 'Seu IP foi atualizado!',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'ip-update',
        renotify: true,
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'Ver Detalhes',
                icon: '/icon-72x72.png'
            },
            {
                action: 'dismiss',
                title: 'Dispensar',
                icon: '/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Meu IP', options)
    );
});

// Manipular cliques em notificações
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Sincronização em background
self.addEventListener('sync', event => {
    if (event.tag === 'ip-check') {
        event.waitUntil(performIPCheck());
    }
});

// Função para verificar IP em background
async function performIPCheck() {
    try {
        const response = await fetch('https://ipinfo.io/json?token=7e914d5080da7d');
        const data = await response.json();
        
        // Enviar dados para clientes ativos
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'IP_UPDATE',
                data: data
            });
        });
        
        console.log('[SW] Verificação de IP em background concluída');
    } catch (error) {
        console.error('[SW] Erro na verificação de IP em background:', error);
    }
}

// Log de instalação bem-sucedida
console.log('[SW] Service Worker carregado com sucesso!');

