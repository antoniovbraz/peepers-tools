## Plano de Implementação — Item Story Forge

### Sprint 1 — Quick Wins ✅ CONCLUÍDO

| # | Tarefa | Status |
|---|--------|--------|
| 1 | Input sanitization LLM (`sanitizeForLLM`, `sanitizeArrayForLLM`, `LLM_SAFETY_INSTRUCTION`) | ✅ |
| 2 | Error Boundary global com fallback UI + retry | ✅ |
| 3 | Export paralelo (`Promise.all` nos 3 blocos de fetch) | ✅ |
| 4 | Meta tags reais (PT-BR, description, OG tags) | ✅ |
| 5 | CORS produção (allowlist exata + wildcards dev) | ✅ |

### Sprint 2 — Estabilidade e UX (próximo)

| # | Tarefa | Status |
|---|--------|--------|
| 6 | Save/Resume Draft (localStorage + toast) | ⬜ |
| 7 | Paginação History (infinite scroll / .range()) | ⬜ |
| 8 | Feedback de progresso AI (mensagens de estágio) | ⬜ |
| 9 | Canvas rAF (requestAnimationFrame no drag) | ⬜ |
| 10 | Índice DB (user_id, created_at DESC) | ⬜ |
| 11 | Reduzir friction (avançar com <7 imagens) | ⬜ |

### Sprint 3 — Qualidade e Observabilidade

| # | Tarefa | Status |
|---|--------|--------|
| 12 | TypeScript strict: true | ⬜ |
| 13 | Testes unitários (40% coverage) | ⬜ |
| 14 | Logging estruturado (request ID, userId) | ⬜ |
| 15 | Code splitting (React.lazy) | ⬜ |
| 16 | Acessibilidade canvas (ARIA, keyboard) | ⬜ |
