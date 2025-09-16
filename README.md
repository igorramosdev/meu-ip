# 🌐 Meu IP - PWA Moderno para Análise de Endereços IP

Um Progressive Web App (PWA) moderno, responsivo e elegante para descobrir informações sobre seu endereço IP, localização geográfica e manter um histórico detalhado de suas conexões.

## ✨ Características Principais

### 🎨 Design Moderno
- **Layout Glass Morphism**: Interface moderna com efeitos de vidro e gradientes
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Animações Suaves**: Transições e animações que melhoram a experiência do usuário
- **Tema Escuro/Claro**: Design adaptável com cores modernas

### 📱 Progressive Web App (PWA)
- **Instalável**: Pode ser instalado como um app nativo no dispositivo
- **Offline**: Funciona mesmo sem conexão com internet (cache inteligente)
- **Notificações**: Receba alertas quando seu IP mudar
- **Service Worker**: Cache automático para performance otimizada
- **Manifest**: Configuração completa para instalação como app

### 🔍 Funcionalidades Avançadas
- **IP Atual**: Exibe seu endereço IP público em tempo real
- **IP Reverso**: Mostra o hostname (DNS reverso) associado ao seu IP
- **Geolocalização**: Localização aproximada baseada no IP
- **Provedor**: Informações sobre sua operadora/ISP
- **Histórico Inteligente**: Salva automaticamente mudanças de IP no localStorage
- **Detecção Automática**: Monitora mudanças de IP em background

### 🛡️ Privacidade e Segurança
- **100% Local**: Histórico armazenado apenas no seu navegador
- **Sem Servidores**: Nenhum dado é enviado para nossos servidores
- **API Confiável**: Utiliza IPinfo.io para dados precisos
- **Código Aberto**: Transparência total no funcionamento

### 🚀 SEO Otimizado
- **Meta Tags Completas**: Title, description, keywords otimizados
- **Open Graph**: Compartilhamento perfeito em redes sociais
- **JSON-LD Schema**: Estrutura de dados para mecanismos de busca
- **Conteúdo Educativo**: Seções informativas sobre IPs e redes
- **FAQ**: Perguntas frequentes para melhor indexação

## 🚀 Funcionalidades

### Informações em Destaque
- **IP Atual**: Exibe o endereço IP do visitante em destaque
- **IP Reverso**: Mostra o hostname associado ao IP
- **Provedor**: Informações sobre a organização/ISP
- **Localização**: Cidade, estado e país quando disponível

### Histórico Inteligente
- **Armazenamento Local**: Histórico salvo no localStorage do navegador
- **Atualização Automática**: Se o IP já existe, apenas atualiza a data/hora
- **Ordenação Cronológica**: Registros do mais recente para o mais antigo
- **Limite de Entradas**: Máximo de 50 registros para otimizar performance

### Controles Interativos
- **Atualizar IP**: Busca novamente as informações do IP
- **Copiar IP**: Copia o IP atual para a área de transferência
- **Limpar Histórico**: Remove todos os registros salvos (com confirmação)

## 📁 Estrutura do Projeto

```
meu-ip-webapp/
├── index.html          # Página principal
├── demo.html           # Versão de demonstração
├── style.css           # Estilos CSS responsivos
├── script.js           # Lógica JavaScript principal
└── README.md           # Documentação
```

## 🔧 Configuração da API

O webapp utiliza a API do [IPinfo.io](https://ipinfo.io) para obter informações detalhadas sobre o IP.

### Substituindo o Token da API

1. Abra o arquivo `script.js`
2. Localize a seção de configuração da API:

```javascript
const API_CONFIG = {
    token: '7e914d5080da7d',  // ← Substitua aqui
    baseUrl: 'https://ipinfo.io',
    timeout: 10000
};
```

3. Substitua o valor do `token` pelo seu token pessoal do IPinfo.io
4. Para obter um token gratuito, visite: https://ipinfo.io/signup

### Limites da API Gratuita
- **50.000 requisições/mês** para contas gratuitas
- **1.000 requisições/dia** para uso sem token
- Para mais informações: https://ipinfo.io/pricing

## 🌐 Deploy e Hospedagem

### Opção 1: GitHub Pages (Recomendado)

1. **Crie um repositório no GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/meu-ip.git
   git push -u origin main
   ```

2. **Configure o GitHub Pages**:
   - Vá para Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Clique em Save

3. **Acesse seu site**:
   - URL: `https://SEU_USUARIO.github.io/meu-ip`

### Opção 2: Netlify

1. **Deploy via Git**:
   - Acesse [netlify.com](https://netlify.com)
   - Clique em "New site from Git"
   - Conecte seu repositório GitHub
   - Deploy automático configurado

2. **Deploy via Drag & Drop**:
   - Acesse [netlify.com/drop](https://netlify.com/drop)
   - Arraste a pasta do projeto
   - Deploy instantâneo

### Opção 3: Vercel

1. **Instale o Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   cd meu-ip-webapp
   vercel
   ```

### Opção 4: Servidor Próprio

1. **Upload via FTP/SFTP**:
   - Faça upload de todos os arquivos para o diretório público do servidor
   - Certifique-se de que o `index.html` está na raiz

2. **Servidor Local para Testes**:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

## 🔒 Privacidade e Segurança

### Armazenamento de Dados
- **Local Apenas**: Todos os dados são armazenados localmente no navegador
- **Sem Servidor**: Nenhuma informação é enviada para nossos servidores
- **Controle Total**: O usuário pode limpar o histórico a qualquer momento

### API Externa
- **IPinfo.io**: Serviço confiável e respeitado na indústria
- **HTTPS**: Todas as requisições são criptografadas
- **Sem Logs**: Não mantemos logs das consultas realizadas

### Recomendações
- Informe aos usuários sobre o uso da API externa
- Considere implementar uma política de privacidade
- Para uso comercial, verifique os termos do IPinfo.io

## 🎨 Personalização

### Cores e Tema
Edite as variáveis CSS no arquivo `style.css`:

```css
:root {
    --primary-color: #2563eb;      /* Cor principal */
    --secondary-color: #64748b;    /* Cor secundária */
    --bg-primary: #ffffff;         /* Fundo principal */
    --bg-secondary: #f8fafc;       /* Fundo secundário */
    /* ... outras variáveis */
}
```

### Fontes
A fonte padrão é Inter. Para alterar:

```css
--font-family: 'SuaFonte', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Layout Responsivo
Os breakpoints estão definidos em:
- **Desktop**: > 768px
- **Tablet**: 768px - 480px  
- **Mobile**: < 480px

## 🐛 Solução de Problemas

### Erro "Failed to fetch" ou CORS
- **Causa**: Acesso via `file://` ou bloqueador de anúncios
- **Solução**: Use um servidor HTTP local ou hospede online

### API não responde
- **Verifique**: Token válido e limite de requisições
- **Teste**: Acesse `https://ipinfo.io/json?token=SEU_TOKEN` no navegador

### Histórico não salva
- **Causa**: localStorage desabilitado ou modo privado
- **Solução**: Verifique as configurações do navegador

### Layout quebrado no mobile
- **Verifique**: Meta tag viewport no HTML
- **Teste**: Use as ferramentas de desenvolvedor do navegador

## 📱 Compatibilidade

### Navegadores Suportados
- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+
- **Opera**: 47+

### Recursos Utilizados
- **Fetch API**: Para requisições HTTP
- **localStorage**: Para armazenamento local
- **CSS Grid/Flexbox**: Para layout responsivo
- **ES6+**: Sintaxe moderna do JavaScript

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- [IPinfo.io](https://ipinfo.io) - API de informações de IP
- [Inter Font](https://rsms.me/inter/) - Tipografia moderna
- [Heroicons](https://heroicons.com) - Ícones utilizados

## 📞 Suporte

Para dúvidas ou suporte:
- Abra uma [issue](https://github.com/SEU_USUARIO/meu-ip/issues)
- Entre em contato: seu-email@exemplo.com

---

**Desenvolvido com ❤️ para a comunidade**


## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design moderno com Flexbox, Grid e animações
- **JavaScript ES6+**: Lógica moderna e eficiente
- **Service Worker**: Cache e funcionalidades offline
- **Web App Manifest**: Configuração PWA
- **IPinfo.io API**: Dados precisos de geolocalização
- **LocalStorage**: Persistência de dados local

## 📦 Estrutura do Projeto

```
meu-ip/
├── index.html              # Página principal
├── style.css               # Estilos modernos e responsivos
├── script.js               # Lógica principal e PWA
├── service-worker.js       # Service Worker para cache e offline
├── manifest.json           # Configuração do PWA
├── icon-*.png             # Ícones para diferentes tamanhos
├── demo.html              # Versão de demonstração
└── README.md              # Esta documentação
```

## 📱 Funcionalidades PWA

### Service Worker
- **Cache Inteligente**: Arquivos estáticos em cache permanente
- **Network First**: APIs sempre buscam dados atualizados
- **Fallback Offline**: Funciona mesmo sem internet
- **Atualizações Automáticas**: Detecta e instala novas versões

### Manifest
- **Instalação**: Comporta-se como app nativo
- **Ícones**: Múltiplos tamanhos para diferentes dispositivos
- **Splash Screen**: Tela de carregamento personalizada
- **Orientação**: Otimizado para portrait e landscape

### Notificações
- **Mudança de IP**: Alerta quando o IP muda
- **Permissões**: Solicita permissão do usuário
- **Background**: Funciona mesmo com app fechado

## 🚀 Como Usar

### 1. Instalação Local

```bash
# Clone o repositório
git clone https://github.com/igorramosdev/meu-ip.git

# Entre na pasta
cd meu-ip

# Inicie um servidor HTTP local
python3 -m http.server 8000
# ou
npx serve .
# ou
php -S localhost:8000
```

### 2. Acesse no Navegador

Abra `http://localhost:8000` no seu navegador.

### 3. Instale como PWA

1. No Chrome/Edge: Clique no ícone de instalação na barra de endereços
2. No Firefox: Menu → "Instalar este site como app"
3. No Safari: Compartilhar → "Adicionar à Tela Inicial"

