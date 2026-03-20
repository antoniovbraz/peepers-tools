## Plano de Implementação — Item Story Forge

### Sprint 1 — Quick Wins ✅ CONCLUÍDO

| # | Tarefa | Status |
|---|--------|--------|
| 1 | Input sanitization LLM (`sanitizeForLLM`, `sanitizeArrayForLLM`, `LLM_SAFETY_INSTRUCTION`) | ✅ |
| 2 | Error Boundary global com fallback UI + retry | ✅ |
| 3 | Export paralelo (`Promise.all` nos 3 blocos de fetch) | ✅ |
| 4 | Meta tags reais (PT-BR, description, OG tags) | ✅ |
| 5 | CORS produção (allowlist exata + wildcards dev) | ✅ |

### Sprint 2 — Estabilidade e UX ✅ CONCLUÍDO

| # | Tarefa | Status |
|---|--------|--------|
| 6 | Save/Resume Draft (localStorage debounced + toast restore) | ✅ |
| 7 | Paginação History (.range() + "Carregar mais") | ✅ |
| 8 | Feedback de progresso AI (barra + estimativa de tempo) | ✅ |
| 9 | Índice DB (user_id, created_at DESC) | ✅ |
| 10 | clearDraft ao salvar anúncio no export | ✅ |

### Sprint 3 — Qualidade e Observabilidade (próximo)

| # | Tarefa | Status |
|---|--------|--------|
| 11 | TypeScript strict: true | ⬜ |
| 12 | Testes unitários (40% coverage) | ⬜ |
| 13 | Logging estruturado (request ID, userId) | ⬜ |
| 14 | Code splitting (React.lazy) | ⬜ |
| 15 | Acessibilidade canvas (ARIA, keyboard) | ⬜ |
