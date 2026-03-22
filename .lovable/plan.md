

## Gerar AUDIT_PROMPT atualizado como Markdown para download

Vou gerar o arquivo `/mnt/documents/AUDIT_PROMPT_v2.md` com o conteúdo original do audit prompt + as seguintes adições/correções:

### Correções
- **localStorage está correto** — confirmei no código que `CreateListingContext.tsx` usa `localStorage` (não sessionStorage). Nenhuma correção necessária aqui.

### Adições

**1. Nova seção "MUDANÇAS RECENTES" (após "O QUE NÃO QUEBRAR")**

Documenta os 6 fixes implementados para que os auditores não reproponham soluções já existentes:

- **Fix 1 — dragMovedRef**: Mobile tap vs drag disambiguation. `dragMovedRef` em `ImageOverlayEditor.tsx:287`. Sheet só abre em `endDrag` se `!dragMovedRef.current`.
- **Fix 2 — Edição em grupo**: Painel bulk edit para 2+ elementos checked. Cor, fontSize, bold, opacidade, delete. `updateCheckedElements()` linha ~974.
- **Fix 3 — Badges na IA**: `generate-overlay-copy/index.ts` agora tem campo `badges` no schema da tool. Client mapeia `data.badges` → elementos tipo `badge`.
- **Fix 4 — Snap inteligente**: `getSnappedPos()` testa 3 âncoras por eixo (left/center/right, top/center/bottom). Helper `getElementSizePercent()` linha ~185.
- **Fix 5 — Toolbar de alinhamento/distribuição**: `alignElements()` e `distributeElements()` com lógica canvas (1 elemento) vs grupo (2+). 8 botões. Linhas ~886-971.
- **Fix 6 — Clamp geral**: Posições clampadas entre 0 e 100-elSize em moveDrag e alinhamento.

**2. Atualizar seção "COMPONENTE CRÍTICO" (item 4)**

Mudar de "Snap em linhas-guia (5%, 50%, 95%)" para: "Snap inteligente com 3 âncoras por eixo (left/center/right) nas linhas-guia (5%, 50%, 95%) via `getElementSizePercent()` + clamp de bounds."

**3. Atualizar tabela de Edge Functions**

Adicionar nota no `generate-overlay-copy`: inclui campo `badges` (array) no schema da tool function.

**4. Nova seção em Etapa 1.3 — Verificação de RLS Policies**

Adicionar item: "RLS policies: verificar se todas as tabelas com dados de usuário têm policies adequadas. Verificar se `user_id` é NOT NULL em tabelas com RLS."

**5. Atualizar "O QUE NÃO QUEBRAR"**

Adicionar:
- `dragMovedRef` — gate de tap vs drag no mobile, remover quebra UX touch
- `getElementSizePercent` + snap de 3 âncoras — reverter causa bug de posicionamento original
- Schema `badges` na edge function — sem ele, IA não popula badges

### Arquivo gerado

`/mnt/documents/AUDIT_PROMPT_v2.md` — versão completa atualizada, pronta para enviar à equipe de auditoria.

