

## Plano: Reescrever Sistema de Prompts com Arquitetura de 3 Blocos

### Problema
Os prompts gerados são genéricos, sem estrutura rígida de fidelidade, realismo e direção de cena. A IA "interpreta" e perde fidelidade ao produto real.

### Solução

Duas mudanças principais: reescrever o system prompt da Edge Function `generate-prompts` e reforçar as instruções de fidelidade na Edge Function `generate-image`.

---

### 1. Reescrever `generate-prompts/index.ts` — System Prompt

Substituir o system prompt atual por um que force a IA a gerar cada prompt com 3 blocos obrigatórios:

**Bloco de Fidelidade** (em todo prompt):
```
Use the EXACT product from the reference image.
Do not change: shape, proportions, materials, colors, button placement, ports, layout.
Preserve all physical characteristics exactly as in the reference.
```

**Bloco de Realismo** (em todo prompt):
```
Make the product look like a real photographed object, not a 3D render.
Use: realistic reflections, accurate shadows, natural light falloff, subtle micro imperfections.
Avoid: plastic look, over-smoothing, fake edges.
```

**Bloco de Direção de Cena** (específico por tipo):
- Câmera: ângulo, lente, perspectiva
- Iluminação: key light, rim light, sombras
- Background: cor, gradiente
- Composição: posição, espaço negativo

**7 tipos padronizados para conversão:**
1. Hero (capa marketplace) — fundo branco, 3/4 angle, 85mm, floating
2. Lifestyle — produto em uso real no contexto do dia-a-dia
3. Uso real — mãos/pessoa interagindo com o produto
4. Close-up técnico — detalhes, textura, materiais, portas
5. Escala — produto ao lado de objeto de referência comum
6. Conteúdo da caixa — unboxing, tudo que vem na embalagem
7. Contexto emocional — cena aspiracional que gera desejo

**Frase final obrigatória em todo prompt:**
```
Ensure the product looks identical to the reference image and not reinterpreted.
```

A tool call retorna array de 7 strings, cada uma com os 3 blocos concatenados.

---

### 2. Reforçar `generate-image/index.ts` — Instrução de Fidelidade

Substituir a instrução genérica atual (linha 28) por instrução estruturada com os mesmos blocos de fidelidade e realismo:

```
Here are reference photos of the ACTUAL product.

FIDELITY RULES (MANDATORY):
- Use the EXACT product from these reference photos
- Do not change: shape, proportions, materials, colors, button placement, ports, layout, logos, branding
- Preserve all physical characteristics exactly as shown

REALISM RULES (MANDATORY):
- Real photographed object, NOT a 3D render
- Realistic reflections based on actual material (metal/plastic/fabric)
- Accurate shadows and natural light falloff
- Subtle micro imperfections for realism
- No plastic look, no over-smoothing, no fake edges

Generate the image following the style direction below.
Ensure the product looks identical to the reference and not reinterpreted.
```

---

### 3. Feedback loop (já existente) — Melhoria menor

Quando o usuário dá feedback negativo e regenera, incluir o feedback como contexto adicional na chamada de `generate-image`, para que a IA corrija o problema reportado. Isso já está parcialmente implementado no `PromptCardItem` (campo `feedback`), mas o feedback não é enviado ao regenerar. Corrigir para enviar.

---

### Ficheiros alterados
- `supabase/functions/generate-prompts/index.ts` — reescrever system prompt
- `supabase/functions/generate-image/index.ts` — reforçar instrução de fidelidade
- `src/components/create/PromptCardItem.tsx` — enviar feedback na regeneração

### Sem alterações de UI, banco ou dependências.

