Quero que você atue simultaneamente como:

1. dono do produto e do negócio
2. Product Owner (PO)
3. Product Manager (PM)
4. arquiteto de software
5. desenvolvedor full-stack sênior
6. revisor técnico extremamente criterioso
7. especialista em UX/UI e responsividade
8. analista de qualidade de código e manutenção

Seu trabalho é analisar este projeto inteiro de forma profunda, entender como ele funciona hoje, identificar problemas e oportunidades, e me entregar um parecer técnico-gerencial completo.

Contexto importante:
- Eu não sou da área técnica de forma avançada.
- Então quero que você explique os pontos com clareza, sem perder profundidade.
- Não quero apenas crítica genérica. Quero análise prática, objetiva e acionável.
- Não assuma coisas sem verificar no código. Quando fizer afirmações, aponte os arquivos, trechos, padrões ou evidências encontradas no projeto.
- Se faltar contexto em alguma parte, diga exatamente o que não foi possível confirmar.
- Priorize honestidade técnica. Não tente me agradar. Quero diagnóstico real.

Objetivo da análise:
Faça uma leitura do projeto como alguém que precisa decidir:
- se a base atual está boa ou ruim
- quais são os maiores riscos
- o que precisa ser corrigido primeiro
- o que está mal estruturado
- o que pode ser melhorado para crescer com segurança, manutenção e qualidade

Quero que você analise no mínimo os seguintes pontos:

1. Visão geral do projeto
- O que o sistema aparentemente faz
- Como está organizado
- Quais são os módulos principais
- Qual parece ser a arquitetura adotada
- Se existe coerência entre proposta, estrutura e implementação

2. Qualidade geral de código
- Clareza
- Legibilidade
- Organização
- Nomenclatura
- Coesão
- Acoplamento
- Repetição de código
- Complexidade desnecessária
- Trechos confusos ou frágeis
- Código morto, duplicado ou mal dividido

3. Boas práticas de engenharia
Analise se o projeto respeita ou viola, com exemplos:
- DRY
- SOLID
- KISS
- Separation of Concerns
- Clean Code
- Design Patterns
- Anti-patterns
- Convenções idiomáticas da stack usada

4. Arquitetura e estrutura técnica
- Pastas e organização
- Separação entre frontend, backend, domínio, serviços, componentes, utilitários, hooks, models etc.
- Fluxo de dados
- Reuso de código
- Escalabilidade
- Facilidade de manutenção
- Se a estrutura está boa para evoluir ou se tende a virar bagunça

5. Bugs e problemas reais
Quero que você procure e destaque:
- bugs visíveis ou prováveis
- edge cases não tratados
- falhas de validação
- risco de quebra em produção
- problemas de estado
- problemas de renderização
- inconsistências entre interface e regra de negócio
- erros de tipagem
- imports quebrados
- funções mal implementadas
- problemas em formulários, APIs, navegação, autenticação, permissões, loading, erros e feedback visual

6. Frontend / UX / UI
- Qualidade do layout
- Hierarquia visual
- Espaçamentos
- consistência visual
- uso de cores, tipografia e componentes
- clareza da interface
- experiência do usuário
- feedback de ações
- empty states
- loading states
- error states
- acessibilidade
- usabilidade real
- aparência profissional ou amadora
- consistência entre páginas e componentes

7. Responsividade
- Como o projeto se comporta em mobile, tablet e desktop
- Pontos com risco de quebra visual
- Componentes que podem estourar layout
- Tabelas, modais, menus, formulários, grids e cards
- Melhorias para tornar a interface realmente responsiva

8. Backend e lógica de negócio
- Organização das regras
- Separação entre regra de negócio e camada de interface
- Serviços, controllers, handlers, repositories etc.
- Segurança básica
- Tratamento de erros
- Consistência das respostas
- Validações de entrada
- Estrutura de APIs
- Possíveis gargalos
- Código sensível ou frágil

9. Banco de dados e persistência
- Modelagem
- Relações
- Migrations
- Queries
- Nomes de campos e tabelas
- Duplicidade
- Integridade
- Possíveis problemas de performance
- Se há sinais de dívida técnica na persistência

10. Performance
- Renderizações desnecessárias
- Componentes pesados
- consultas ruins
- carregamentos desnecessários
- bundles grandes
- loops custosos
- problemas de memoização
- fetches duplicados
- gargalos de UX e de execução

11. Segurança
- Falhas óbvias de segurança
- exposição de segredos
- validações insuficientes
- permissões frágeis
- risco de vazamento de dados
- uso indevido de variáveis de ambiente
- vulnerabilidades previsíveis para a stack usada

12. Padronização e consistência
- Formatação
- Padrões de arquivo
- Convenções de nomes
- organização de imports
- estrutura de componentes
- padrões de tratamento de erro
- consistência entre páginas e módulos
- presença ou ausência de padrões claros

13. Testes e confiabilidade
- Há testes?
- A cobertura parece suficiente?
- O que está desprotegido?
- Onde seria mais importante testar primeiro?
- Quais partes têm mais risco de regressão?

14. Dependências e manutenção
- Bibliotecas mal escolhidas
- dependências desatualizadas ou desnecessárias
- excesso de dependências
- acoplamento a libs
- risco de manutenção futura

15. Documentação e entendimento do projeto
- O projeto é fácil ou difícil de entender para alguém novo?
- README ajuda ou atrapalha?
- Existem lacunas de documentação?
- O onboarding técnico seria simples ou difícil?

Forma de resposta:
Quero sua resposta organizada exatamente nesta estrutura:

A. Resumo executivo
- visão geral curta do estado do projeto
- nota geral de 0 a 10
- nível de maturidade do projeto
- diagnóstico franco em linguagem clara

B. Pontos fortes
- o que está bom
- o que está razoavelmente bem feito
- o que vale preservar

C. Principais problemas encontrados
- liste por ordem de gravidade
- separe em: crítico, alto, médio e baixo
- explique por que cada ponto importa

D. Bugs e riscos concretos
- descreva os bugs encontrados ou altamente prováveis
- aponte evidências
- diga impacto e urgência

E. Dívidas técnicas
- o que hoje funciona, mas está mal construído
- o que vai gerar problema depois

F. Avaliação de arquitetura
- diga se a arquitetura atual sustenta crescimento
- diga onde está boa e onde está falhando

G. Avaliação de frontend / UX / UI
- design
- clareza
- consistência
- responsividade
- profissionalismo visual

H. Avaliação de código e engenharia
- DRY
- SOLID
- design patterns
- separação de responsabilidades
- manutenção
- legibilidade

I. Plano de ação priorizado
Monte um plano em 3 horizontes:
1. corrigir imediatamente
2. melhorar no curto prazo
3. refatorar no médio prazo

Para cada item, informe:
- problema
- impacto
- prioridade
- dificuldade estimada: baixa, média ou alta
- benefício esperado

J. Quick wins
- liste melhorias rápidas com alto impacto e baixo esforço

K. Refatorações recomendadas
- diga exatamente o que refatorar
- em quais arquivos ou áreas
- qual padrão seria melhor adotar

L. Parecer final
- eu seguiria com essa base?
- eu refatoraria parcialmente?
- eu reconstruiria partes?
- quão confiável isso parece para produção?

Regras importantes:
- Não fique só elogiando.
- Não entregue resposta vaga.
- Não fale apenas em teoria.
- Traga exemplos concretos do código.
- Cite arquivos, componentes, funções, padrões e trechos relevantes.
- Quando houver dúvida, deixe explícito.
- Quando encontrar algo bom, diga por que é bom.
- Quando encontrar algo ruim, diga como melhorar.
- Quero profundidade técnica, mas com explicação compreensível para alguém de negócio.

No final, crie também uma seção extra chamada:
“Mudanças que eu faria se este projeto fosse meu”
Nessa parte, quero que você fale com franqueza de dono: o que manteria, o que cortaria, o que reorganizaria, o que simplificaria e o que profissionalizaria.

Comece lendo e entendendo o projeto antes de julgar.

DEPOIS transforme sua análise em um plano operacional.

Quero uma checklist prática, em ordem ideal de execução, contendo:
- tarefa
- objetivo
- impacto no negócio
- impacto técnico
- prioridade
- dificuldade
- arquivos afetados
- risco de quebra
- como validar se ficou bom

Organize em:
1. correções urgentes
2. melhorias de qualidade
3. refatorações estruturais
4. melhorias visuais e de UX
5. melhorias de performance
6. melhorias de segurança