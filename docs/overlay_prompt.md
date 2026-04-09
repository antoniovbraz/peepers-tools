Quero que você atue como uma combinação de:

- fundador/dono do produto
- Product Designer sênior
- Staff/Principal Full-Stack Engineer
- arquiteto de software
- especialista em UX/UI de altíssimo nível
- engenheiro obcecado por código limpo, escalabilidade e manutenção
- revisor técnico extremamente crítico e exigente

Sua missão é fazer uma refatoração completa, profunda e sem medo do componente/ferramenta `ImageOverlayEditor`.

Contexto importante:
- Esta é uma aplicação pessoal minha, ainda em fase de testes.
- Você não precisa preservar arquitetura ruim por compatibilidade.
- Pode refazer do zero se isso for a melhor solução.
- Pode resetar banco de dados.
- Pode alterar modelos.
- Pode alterar fluxos.
- Pode alterar estrutura de pastas.
- Pode alterar componentes, hooks, stores, services, rotas e contratos.
- Pode eliminar código legado ruim.
- Pode recriar a experiência inteira.
- Pense nisso como a versão 0.0.1 de uma ferramenta que ainda está nascendo, e não como um sistema maduro que precisa respeitar legado.

Diretriz central:
Eu não quero remendo, gambiarra, maquiagem nem “ajustes locais” em uma base ruim.
Eu quero que você repense a ferramenta de overlay do zero, com criatividade, inteligência de produto, visão sistêmica e excelência técnica.
Se a melhor resposta for demolir e reconstruir, faça isso.
Não seja conservador por preguiça.
Não seja tímido nas decisões.
Não faça apenas melhorias cosméticas.
Quero uma solução realmente melhor.

Objetivo:
Transformar o `ImageOverlayEditor` em uma ferramenta de overlay muito mais bem pensada, moderna, intuitiva, robusta, elegante e tecnicamente sólida, considerando:
- UX/UI de alto nível
- experiência real do usuário
- clareza de fluxo
- performance
- responsividade
- acessibilidade
- organização de código
- escalabilidade
- legibilidade
- manutenção futura
- separação de responsabilidades
- consistência visual e estrutural

Quero que você trate a ferramenta como um produto de verdade, não apenas como um componente isolado.

O que espero da sua análise e execução:

1. Entender o estado atual
Antes de sair codando, analise profundamente o `ImageOverlayEditor` atual e tudo que impacta ele:
- componentes relacionados
- hooks
- stores
- lógica de canvas/editor
- modelos de dados
- persistência
- exportação
- upload
- renderização
- toolbar
- painel lateral
- propriedades
- histórico
- interações
- atalhos
- qualquer fluxo conectado

Quero que você identifique:
- gargalos de UX
- gargalos técnicos
- complexidade desnecessária
- acoplamento excessivo
- duplicação
- estados mal modelados
- responsabilidades misturadas
- naming ruim
- layout confuso
- fluxos pouco intuitivos
- pontos frágeis
- bugs prováveis
- limitações da arquitetura atual

2. Reimaginar a ferramenta de forma criativa
Quero que você pense fora da caixa.
Não quero só “um editor que funciona”.
Quero que você imagine como essa ferramenta deveria ser se fosse redesenhada hoje com o melhor de:
- editores modernos
- ferramentas visuais bem resolvidas
- interfaces limpas e profissionais
- UX orientada a tarefa
- fluidez de edição
- feedback visual claro
- interações naturais
- consistência entre ações, estados e resultados

Pense em:
- estrutura ideal de toolbar
- painel de propriedades
- sistema de camadas
- experiência de seleção e edição
- arrastar, redimensionar, rotacionar, alinhar
- snapping
- guias visuais
- atalhos de teclado
- undo/redo
- zoom e navegação
- autosave
- feedback de loading/erro
- estados vazios
- fluxo de exportação
- clareza entre imagem base e overlays
- edição mais intuitiva e menos sujeita a erro
- organização da tela para desktop e mobile
- microinterações úteis
- arquitetura pronta para crescer

3. Refatorar com visão de sistema
Não quero uma refatoração local só do arquivo principal.
Quero que você avalie o sistema inteiro ao redor da ferramenta e mude tudo que precisar para que o editor fique realmente bom.

Você tem liberdade para:
- quebrar componentes grandes
- recriar a modelagem de estado
- trocar a estratégia de gerenciamento de estado
- mover responsabilidades para serviços ou hooks específicos
- criar módulos de domínio
- isolar engine do editor da camada visual
- reorganizar pastas
- renomear arquivos
- remover abstrações ruins
- criar abstrações melhores
- redesenhar contratos de dados
- refazer persistência
- mudar schema se necessário
- reescrever partes inteiras

4. Qualidade de engenharia obrigatória
Quero que a nova solução seja construída com obsessão por:
- código limpo
- legibilidade
- baixo acoplamento
- alta coesão
- DRY sem overengineering
- SOLID quando fizer sentido
- separation of concerns
- design orientado a domínio/comportamento
- previsibilidade de estado
- componentes pequenos e claros
- tipagem forte
- funções com responsabilidade única
- convenções consistentes
- estrutura fácil de manter
- arquitetura que aceite evolução sem virar bagunça

Evite:
- gambiarras
- hacks temporários fingindo ser definitivos
- complexidade ornamental
- abstrações prematuras ruins
- lógica espalhada
- ifs caóticos
- dependência circular
- componente monolítico
- state explosion
- props drilling desnecessário
- duplicação de comportamento
- naming vago
- código “mágico”

5. UX/UI obrigatória
Quero uma proposta forte de UX/UI.
A ferramenta precisa parecer mais profissional, clara e gostosa de usar.

Analise e melhore:
- hierarquia visual
- espaçamento
- alinhamento
- densidade da interface
- consistência de componentes
- clareza dos controles
- discoverability
- feedback de interação
- affordance
- painéis e barra de ações
- legibilidade de labels
- fluxo de edição
- sensação de produto premium e bem resolvido

A interface deve:
- reduzir atrito
- reduzir ambiguidade
- facilitar tarefas frequentes
- deixar ações críticas óbvias
- esconder complexidade desnecessária
- manter poder para usuários avançados
- funcionar bem em diferentes tamanhos de tela
- ter estados de erro e loading bem resolvidos
- ter empty states decentes
- priorizar o que realmente importa para o usuário

6. Responsividade e acessibilidade
Quero que você trate responsividade como requisito de produto, não detalhe secundário.

Analise e resolva:
- quebra em telas menores
- toolbars lotadas
- painéis que espremem conteúdo
- canvas mal adaptado
- overflow ruim
- botões pequenos demais
- problemas de navegação em mobile/tablet
- inconsistências entre breakpoints

Também quero atenção real a:
- foco
- navegação por teclado
- labels
- contraste
- acessibilidade básica de interações
- áreas clicáveis adequadas

7. Performance
Quero que você pense performance desde a arquitetura:
- renderizações desnecessárias
- reatividade exagerada
- estado global demais
- recomputações evitáveis
- canvas/render pesado
- updates excessivos
- listeners mal gerenciados
- exportação ineficiente
- gargalos em drag/resize/transformações

8. Persistência e modelo de dados
Se o modelo atual estiver ruim, refaça.
Não fique preso ao banco atual.
Pode alterar ou recriar:
- tabelas
- schemas
- entidades
- relacionamentos
- nomenclatura
- estrutura de persistência
- serialização do editor
- formato salvo do overlay

Quero um modelo que faça sentido para a ferramenta, mesmo que isso signifique resetar tudo.

9. Modo de trabalho
Não quero uma resposta preguiçosa, superficial ou só consultiva.
Quero atitude de dono e executor.
Você deve:
- analisar
- criticar
- propor
- decidir
- refatorar
- implementar

Quando houver múltiplos caminhos possíveis:
- escolha o mais robusto e profissional
- explique por que escolheu
- não fique paralisado por excesso de opções

Quando encontrar arquitetura ruim:
- diga claramente que está ruim
- explique o problema
- corrija da melhor forma

Quando perceber que algo deve ser removido:
- remova

Quando perceber que algo precisa nascer de novo:
- recrie

10. Entregáveis esperados
Quero que você me entregue, ao longo do processo, no mínimo:

A. Diagnóstico do estado atual
- o que existe hoje
- o que está ruim
- o que está quebrado ou mal resolvido
- gargalos técnicos
- gargalos de UX/UI
- riscos de manutenção

B. Nova direção de produto para o editor
- visão da ferramenta
- princípios de UX/UI
- fluxo ideal do usuário
- organização geral da experiência

C. Nova arquitetura proposta
- divisão por módulos
- responsabilidades
- estrutura de componentes
- hooks
- stores
- services
- domain logic
- persistência
- contratos

D. Plano de reconstrução
- o que vai ser removido
- o que vai ser reaproveitado
- o que vai ser recriado
- ordem ideal de execução

E. Implementação real
- faça as mudanças no código
- não pare na teoria
- reestruture os arquivos necessários
- escreva a nova solução com capricho

F. Limpeza e padronização
- remova código morto
- elimine duplicações
- padronize naming
- organize imports
- melhore tipagem
- deixe a base mais profissional

G. Parecer final
- o que mudou
- por que a nova solução é melhor
- o que ainda pode evoluir depois

11. Formato de resposta
Quero que você organize sua resposta sempre em blocos claros:

1. Diagnóstico franco do estado atual
2. Problemas centrais encontrados
3. Direção de produto e UX/UI para a nova versão
4. Arquitetura proposta
5. Plano de reconstrução
6. Implementação realizada
7. Arquivos criados, removidos e alterados
8. Decisões técnicas importantes
9. Trade-offs assumidos
10. Próximos passos recomendados

12. Regra final de postura
Atue com ambição, rigor e senso crítico.
Pense como alguém que quer transformar essa ferramenta em algo realmente excelente.
Quero dedicação real.
Quero inteligência aplicada.
Quero visão de produto.
Quero engenharia de verdade.
Quero uma solução elegante, limpa, forte e coerente.

Não proteja código ruim por pena.
Não seja acomodado.
Não seja burocrático.
Não seja preguiçoso.
Não tente “melhorar um pouco”.
Reconstrua da forma que um excelente time construiria se esse editor fosse estratégico.

Pode começar pela leitura completa da implementação atual do `ImageOverlayEditor`, mapear toda a arquitetura envolvida e, em seguida, partir para a reconstrução da versão 0.0.1.