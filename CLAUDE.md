# Finanças — App de Controle Financeiro Doméstico

## Stack
- React + Vite (PWA)
- **PocketBase** como backend/banco de dados (dados em tempo real, compartilhados entre dispositivos)
- EmailJS para envio de e-mails (senhas, redefinição)
- Frontend hospedado no VPS (nginx)
- Repositório: https://github.com/thiaggophp/App-Financas (público)
- URL: https://financascasa.online

## Infraestrutura
- **VPS:** Locaweb — Debian 12 (IP guardado internamente)
- **Domínio:** financascasa.online (DNS na Locaweb)
- **App:** https://financascasa.online (nginx → /var/www/financascasa)
- **API:** https://api.financascasa.online (nginx → PocketBase :8090)
- **PocketBase painel:** https://api.financascasa.online/_/
- **SSL:** Let's Encrypt (renova automaticamente via certbot)

## Acesso SSH ao VPS
A chave privada está em `C:\Users\Thiago.SYGMA\.ssh\financas_vps`.
Em outro computador: copie a chave privada para `~/.ssh/financas_vps` e conecte via SSH ao IP do VPS (disponível no painel da Locaweb).

## Estrutura
```
financas-casa/
├── public/ (manifest.json, sw.js, ícones)
├── src/
│   ├── main.jsx
│   ├── App.jsx (roteamento, auth, sessão persistida no sessionStorage)
│   ├── db.js (PocketBase — accounts, groups, members, entries, goals, signup_requests)
│   ├── emailService.js (EmailJS — credenciais via import.meta.env.VITE_*)
│   ├── backup.js (exportar/importar JSON)
│   ├── components/ (Modal, Card, FormElements, Avatar)
│   └── pages/
│       ├── Login.jsx (login, redefinir senha, solicitar cadastro)
│       ├── Admin.jsx (apenas admin — usuários, solicitações em tempo real via PocketBase subscriptions)
│       ├── Dashboard.jsx (resumo financeiro mensal)
│       ├── Entries.jsx (lançamentos receita/despesa com filtros e 50/50)
│       ├── Groups.jsx (grupos e membros; membros podem ter email+senha para login próprio)
│       ├── Goals.jsx (metas de economia com progresso)
│       ├── Reports.jsx (gráfico anual receitas vs despesas)
│       └── Config.jsx (alterar senha, backup/restauração)
├── .env (NÃO commitado — credenciais reais)
├── .env.example (commitado — exemplo sem valores reais)
├── index.html
├── vite.config.js
└── package.json
```

## Variáveis de Ambiente
**Arquivo `.env` local e no VPS (`/var/www/financascasa/.env`):**
```
VITE_PB_URL=https://api.financascasa.online
VITE_ADMIN_EMAIL=<seu_email_admin>
VITE_ADMIN_PASSWORD=<sua_senha_admin>
VITE_EMAILJS_SERVICE_ID=<seu_service_id>
VITE_EMAILJS_TEMPLATE_ID=<seu_template_id>
VITE_EMAILJS_PUBLIC_KEY=<sua_public_key>
```

## Credenciais
- **PocketBase superuser:** email e senha guardados com o proprietário (não commitados)
- **EmailJS:** configuradas via variáveis de ambiente
- **Admin app:** email e senha definidos via VITE_ADMIN_EMAIL e VITE_ADMIN_PASSWORD

## Regras de Negócio
1. Login por e-mail + senha. Ao criar usuário, senha aleatória é enviada por e-mail via EmailJS.
2. Primeiro acesso obriga redefinição de senha (mustChangePassword: true).
3. Admin (VITE_ADMIN_EMAIL) gerencia usuários principais, aprova solicitações em tempo real, bloqueia e altera senhas.
4. Cada usuário principal pode criar membros em seus grupos com email+senha — login próprio (parentEmail vincula ao dono).
5. Sub-usuários (parentEmail definido) NÃO aparecem no painel Admin; gerenciados pelo dono na página Grupos.
6. Dados compartilhados em tempo real entre dispositivos via PocketBase.
7. Sessão persiste no sessionStorage — atualizar a página não faz logout.
8. PWA instalável: Android (Chrome → Adicionar à tela inicial) | iPhone (Safari → Compartilhar → Adicionar à Tela Inicial).

## Comandos
- `npm run dev` — rodar local (http://localhost:5173)
- `npm run build` — gerar build de produção
- `git add . && git commit -m "msg" && git push` — envia para GitHub
