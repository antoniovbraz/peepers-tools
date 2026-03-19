

## Diagnóstico: Botão "Adicionar texto / efeitos" não aparece

### Como deveria funcionar
- **Imagem #1 (Cover)**: Nunca mostra o botão (por design — Cover é imagem limpa)
- **Imagens #2 a #7**: O botão "Adicionar texto / efeitos" aparece **assim que cada imagem individual é aprovada** (clique em "Ficou boa"). Não precisa aprovar todas.

### Problema encontrado
O código está logicamente correto (`p.approved && i > 0`), mas há um possível bug de renderização: quando você faz **upload manual** de uma imagem e aprova, a `imageUrl` é um `blob:` URL local. Se o componente re-renderiza (por ex. ao scroll ou ao aprovar outra imagem), o blob pode ser invalidado e o card pode "perder" a imagem, voltando ao estado sem botão.

### Correção proposta

1. **Testar se o bug é reproduzível** — Aprovar uma imagem #2 (não #1) e verificar se o botão aparece imediatamente
2. **Adicionar log de debug temporário** para confirmar que `p.approved` e `i` estão corretos no momento da renderização
3. **Se confirmado que funciona mas é intermitente**: converter uploads manuais (`blob:` URLs) para Storage imediatamente após upload, garantindo que a URL persiste

### Mudança principal
- Em `PromptCardItem.tsx`, no `handleImageUpload`, após criar o blob, fazer upload imediato para o bucket `generated-images` e usar a URL pública em vez do blob

### Ficheiro afetado
- `src/components/create/PromptCardItem.tsx` — upload manual → Storage

