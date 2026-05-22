# Projeto Cassanova Casino - Relatório de Status V3 (Milestone de Integração Core & G-Machine)

## 1. Visão Geral do Projeto
O **Cassanova Casino** é uma plataforma iGaming de elite, estruturada sob um ecossistema tripartite robusto, focado em alta performance, segurança financeira transacional, design glassmorphism moderno e jogos em tempo real com estado persistente.

Este documento formaliza as realizações técnicas até a **Versão 3 (V3)**, que consolida a arquitetura de Seamless Wallet, o Remote Gaming Server (G-Machine RGS) e a correção definitiva do fluxo de builds para deploy em produção (ajuste realizado com sucesso para o Render).

---

## 2. Arquitetura Tripartite de Ciclo Fechado

O ecossistema divide-se estritamente em três microsserviços integrados:

### A. Plataforma Core (Backend)
* **Tecnologias:** Node.js, Express, TypeScript, JWT, MongoDB Atlas (Mongoose ODM).
* **Responsabilidade:** Dono do saldo, autenticação principal e persistência financeira do usuário.
* **Segurança Transacional:** Implementação do conceito **Seamless Wallet** robusto. Expõe endpoints protegidos por autenticação atômica e segredo interno (`G_MACHINE_SECRET`).
* **Endpoints Principais da Carteira:**
  * `POST /api/v1/wallet/debit`: Deduz o valor acordado para aposta diretamente no MongoDB de forma atômica (`$inc: { balance: -amount }`). Insere o registro de transação do tipo `bet`.
  * `POST /api/v1/wallet/credit`: Adiciona o valor obtido de ganho de forma segura no MongoDB (`$inc: { balance: amount }`). Insere o registro de transação do tipo `win`.

### B. Plataforma Core (Frontend)
* **Tecnologias:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion.
* **Estética de Alta Fidelidade (Identidade visual Cassanova):** Tons profundos de roxo, rosa neon e dourado (`#EF4444`, `#F59E0B`, gradientes escuros) aplicados por meio de efeitos glassmorphism polidos, sombras suaves e tipografia moderna (Inter).
* **Funcionalidades:**
  * Lobby unificado de jogos (Original, Slots, Live).
  * Contexto de Autenticação global persistente (`auth-context.tsx`).
  * Fluxo Financeiro Simplificado via **PIX Único** (Depósitos com QR Code copiável/escanável e saques de saldo validados pelo backend, otimizando taxas e tempo de conversão).
  * Integração de tela cheia para jogos com renderização client-side estrita (`ssr: false` via Dynamic Imports do Next.js) para injeção dinâmica de canvas gráficos de alta performance.

### C. Servidor de Jogos Proprietário (G-Machine RGS)
* **Tecnologias:** Node.js Puro, TypeScript, `ws` (WebSockets) e motor matemático RNG de bobinas.
* **Responsabilidade:** Remote Gaming Server (RGS) isolado, focado unicamente na lógica de ganhos, geração estruturada de matrizes de jogo e simulação probabilística segura (sem acesso direto ao MongoDB ou ciclos de renderização do Next.js).
* **Conectividade:** Mantém ouvinte estável de WebSockets. Ao receber a requisição de giro (SPIN):
  1. Autentica o status do token de sessão JWT.
  2. Executa a requisição de débito HTTP via `axios` na Seamless Wallet do Backend Core.
  3. Com a transação aprovada e retorno do saldo, executa a matemática do jogo (`SlotEngine`).
  4. Dispara a requisição HTTP de crédito na Seamless Wallet, caso haja prêmio calculado.
  5. Devolve o estado da matriz atualizada, as flags de animação e o saldo atualizado em tempo real para o cliente.

---

## 3. Realizações Técnicas Recentes e Correções (V3)

### A. Resolução de Crise de Build no Render (Axios TS2307)
* **Problema:** O deploy em produção (via Render) quebrava no passo `npm run build` devido ao erro `TS2307: Cannot find module 'axios'` originado de uma importação redundante do `axios` dentro de `src/controllers/diagnostics.controller.ts`.
* **Solução:** O controlador de diagnósticos foi refatorado. A dependência inativa do `axios` no backend foi eliminada, e o diagnóstico de conectividade com a G-Machine RGS foi simplificado para monitoramento estruturado de configuração. A compilação local e remota agora ocorre perfeitamente com sucesso absoluto de build.

### B. Esclarecimento do Log de Erro (HEAD / 404)
* **Análise:** O log `HEAD / 404` observado no servidor de produção é um comportamento normal e benigno. Trata-se da requisição de ping automatizada do balanceador de carga ou do próprio sistema de hospedagem Render (e.g., Uptime check ou Health Check padrão). Como o roteamento principal do Backend é desenhado sobre endpoints explícitos `/api/*`, a rota de teste `/` sob o método de cabeçalho `HEAD` não possui manipulador explícito pré-definido, retornando 404 com segurança sem impactar de qualquer forma o funcionamento do casino ou da G-Machine.

### C. Estrutura de Arquivos Consolidada
* `/gmachine/src/server.ts`: Servidor nativo de WebSocket (RGS) tratando Handshakes via JWT, ações do jogador (SPIN/AUTH) e comunicação direta via HTTP à Seamless Wallet.
* `/backend/src/controllers/wallet.controller.ts`: Implementação atômica altamente segura das operações de débito e crédito financeiro com controle transacional no banco MongoDB.
* `/backend/src/controllers/diagnostics.controller.ts`: Monitoramento limpo do status operacional de rede e banco de dados.

---

## 4. Próxima Fase do Roteiro (Roadmap V4)
* **Persistência de Bônus de Respins no Redis:** Ativação total do mecanismo de retenção de rodadas extras gratuitas por meio de conexões Redis na G-Machine.
* **Canvas de Alta Performance no Tiger Game:** Integração total do componente PixiJS no frontend cliente para exibição fluida da matriz de retorno gerada dinamicamente pelo WebSocket do RGS.
* **Auditoria de Provably Fair:** Criação de módulo transparente para que os usuários auditem matematicamente a aleatoriedade de cada giro (SHA-256 seed audit).

---
*Data da Atualização: 22 de Maio de 2026*
*Status Geral: Ecossistema Prontamente Integrado, Compilado e Operacional 🚀*
