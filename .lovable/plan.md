

## Gerar Briefing Técnico para Download

Vou gerar um arquivo Markdown completo em `/mnt/documents/` com o briefing técnico do projeto, cobrindo:

- Visão geral da arquitetura (React + Vite + Supabase)
- Wizard de 5 passos com contexto persistido em sessionStorage
- Editor de Overlay (ImageOverlayEditor.tsx — 1800+ linhas, coordenadas em %)
- Edge Functions (5 funções: identify-product, generate-ads, generate-prompts, generate-image, generate-overlay-copy)
- Bugs conhecidos / decisões de design recentes (loadedForRef, dragMovedRef, snap inteligente)
- Arquivos que NÃO podem ser editados (auto-gerados)
- Convenções de segurança (sanitizeForLLM, CORS, auth manual)
- Estrutura de dados (ListingData, OverlayElement)

**Arquivo gerado:** `/mnt/documents/briefing-tecnico-peepers-shop.md`

