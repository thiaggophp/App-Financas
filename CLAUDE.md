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
A chave privada SSH está salva localmente (não commitada). O IP do VPS está no painel da Locaweb e no secret `VPS_HOST` do GitHub Actions.

## Estrutura
```
financas-casa/
├── public/ (manifest.json, sw.js, ícones)
├── src/
│   ├── main.jsx
│   ├── App.jsx (roteamento, auth, sessão persistida no localStorage — usa URL hash para aba atual)
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
7. Sessão persiste no localStorage (objeto completo do usuário). Aba atual salva via URL hash (#dash, #config, etc.) — F5 preserva a aba.
8. PWA instalável: Android (Chrome → Adicionar à tela inicial) | iPhone (Safari → Compartilhar → Adicionar à Tela Inicial).

## Comandos
- `npm run dev` — rodar local (http://localhost:5173)
- `npm run build` — gerar build de produção
- `git add . && git commit -m "msg" && git push` — envia para GitHub

## Problemas Conhecidos e Soluções

### PocketBase — IDs customizados rejeitados
Nunca gerar IDs manuais ao criar registros. Deixar o PocketBase gerar o ID automaticamente (não incluir campo `id` no create). Incluir `id` apenas no update.

### PocketBase — schema das coleções
Se os campos sumam, recriar via PATCH na API com token de superuser. Schemas das 6 coleções:
- **accounts**: email, name, password, role, status, parentEmail, mustChangePassword (bool), protected (bool)
- **signup_requests**: email, name, requestedAt, status
- **groups**: ownerEmail, name, color, createdAt
- **members**: ownerEmail, groupId, name, memberEmail, color, createdAt
- **entries**: ownerEmail, date, type, category, description, value (number), memberId (text), split (bool), isPaid (bool), paidAt (text), createdAt
- **goals**: ownerEmail, name, target (number), saved (number), createdAt

### Vite — index.html corrompido
O `index.html` raiz DEVE ter `<script type="module" src="/src/main.jsx">`. Se estiver referenciando o bundle compilado, restaurar com `git restore index.html`.

### Vite 8 + Linux — incompatibilidade com pocketbase
Usar Vite 5 (`"vite": "^5.4.19"`). O Vite 8 usa Rolldown que falha ao resolver pocketbase no Linux.

### Deploy manual no VPS
```bash
cd /var/www/financascasa && git pull && npm install && npm run build && cp -r dist/* /var/www/html/ && systemctl reload nginx
```
