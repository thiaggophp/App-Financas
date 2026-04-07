# Finanças — App de Controle Financeiro Doméstico

## Stack
- React + Vite (PWA)
- IndexedDB via `idb` para armazenamento local (dados locais por dispositivo/browser)
- EmailJS para envio de e-mails (senhas, redefinição)
- Deploy no Vercel (auto-deploy via GitHub)
- Repositório: https://github.com/thiaggophp/App-Financas (público)
- URL: https://app-financas-pi-woad.vercel.app

## Estrutura
```
financas-casa/
├── public/ (manifest.json, sw.js, ícones)
├── src/
│   ├── main.jsx
│   ├── App.jsx (roteamento, auth, sessão persistida no sessionStorage, modal de redefinição de senha)
│   ├── db.js (IndexedDB — accounts, groups, members, entries, goals, signup_requests, config)
│   ├── emailService.js (EmailJS — credenciais via import.meta.env.VITE_*)
│   ├── backup.js (exportar/importar JSON — fallback para download se Web Share falhar)
│   ├── components/ (Modal, Card, FormElements, Avatar)
│   └── pages/
│       ├── Login.jsx (login, redefinir senha, solicitar cadastro)
│       ├── Admin.jsx (apenas admin — gerenciar usuários principais, aprovar solicitações, bloquear, excluir; sub-usuários NÃO aparecem aqui)
│       ├── Dashboard.jsx (resumo financeiro mensal)
│       ├── Entries.jsx (lançamentos receita/despesa com filtros e 50/50)
│       ├── Groups.jsx (grupos e membros; membros podem ter email+senha para login próprio — parentEmail vincula ao dono)
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
**Arquivo `.env` local (não vai para o Git):**
```
VITE_ADMIN_EMAIL=thiaggotx@gmail.com
VITE_ADMIN_PASSWORD=sua_senha
VITE_EMAILJS_SERVICE_ID=service_d0uex69
VITE_EMAILJS_TEMPLATE_ID=template_nzuzzgq
VITE_EMAILJS_PUBLIC_KEY=5R9ZxFkk-UzbIXlGh
```
**No Vercel:** Settings → Environment Variables → adicionar as mesmas variáveis acima.

## Credenciais
- **EmailJS:** configuradas via variáveis de ambiente (não expostas no código)
- **Admin:** email e senha definidos via VITE_ADMIN_EMAIL e VITE_ADMIN_PASSWORD

## Regras de Negócio
1. Login por e-mail + senha. Ao criar usuário, senha aleatória é enviada por e-mail via EmailJS.
2. Primeiro acesso obriga redefinição de senha (mustChangePassword: true).
3. Admin (VITE_ADMIN_EMAIL) gerencia usuários principais, aprova solicitações, bloqueia e altera senhas. Não pode ser excluído (protected: true).
4. Cada usuário principal pode criar membros em seus grupos com email+senha — esses membros têm login próprio (conta com parentEmail apontando para o dono).
5. Sub-usuários (parentEmail definido) NÃO aparecem no painel Admin; são gerenciados pelo dono na página de Grupos (bloquear/excluir).
6. Cada login tem dados separados (entries, goals, groups, members filtrados por ownerEmail).
7. Sessão persiste no sessionStorage — atualizar a página não faz logout.
8. Dados são locais ao browser/dispositivo (IndexedDB). Não há sincronização entre dispositivos — isso é uma limitação arquitetural. Para sincronizar precisaria de backend (Firebase/Supabase).
9. Backup exporta JSON com todos os dados do usuário logado. Restauração substitui dados. Fallback para download se Web Share API falhar.
10. PWA instalável: Android (Chrome → Adicionar à tela inicial) | iPhone (Safari → Compartilhar → Adicionar à Tela Inicial).

## Comandos
- `npm run dev` — rodar local (http://localhost:5173)
- `npm run build` — gerar build de produção
- `git add . && git commit -m "msg" && git push` — deploy automático no Vercel
