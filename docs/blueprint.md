# **App Name**: InvGestor

## Core Features:

- Autenticação e Controle de Acesso: Login seguro com email/senha via Firebase Authentication, suportando três níveis de permissão (Administrador, Gerente, Operador) para controle de acesso refinado às funcionalidades do sistema.
- Gestão de Produtos com Validação: Cadastro, consulta e atualização de produtos, incluindo campos como SKU, estoque, preços e validações cruciais para evitar duplicidade de SKU, margem de lucro negativa e valores inválidos, assegurando a integridade dos dados no Firestore.
- Controle de Estoque em Tempo Real e Transacional: Monitoramento rigoroso do estoque com bloqueios para vendas que excedam a quantidade disponível. Inclui alertas visuais para estoque baixo/zero e implementa baixa/estorno automático de produtos via Firestore Transactions para garantir a atomicidade das operações.
- Ponto de Venda (PDV) Intuitivo: Interface otimizada para registro rápido de vendas, com busca de produtos, gerenciamento de carrinho com validação de estoque instantânea, cálculo automático de totais, desconto e diversas formas de pagamento.
- Histórico Detalhado de Movimentações: Registro imutável de todas as movimentações de estoque (entradas, saídas, ajustes, vendas, cancelamentos), detalhando produto, quantidade, usuário responsável e data/hora para auditoria e rastreabilidade completa.
- Ajuste de Inventário com Justificativa: Ferramenta dedicada para corrigir quantidades de estoque no sistema, exigindo um campo de justificativa obrigatório para cada ajuste, mantendo um registro de auditoria completo para conformidade.
- Assistente de Descrição de Produtos (AI): Uma ferramenta de IA que gera descrições de produtos ricas e otimizadas para catálogos ou materiais de marketing, utilizando as informações básicas do produto como base para a criação.

## Style Guidelines:

- Esquema de cores: Uma paleta predominantemente clara com foco em profissionalismo e clareza para ambientes de negócios, adaptável a um modo escuro opcional para preferência do usuário.
- Cor primária: Azul escuro (#1565C0), escolhida para transmitir confiança e estabilidade, conforme a solicitação original.
- Cor de fundo: Azul muito claro e sutil (#EBF2F6), para uma sensação de amplitude e limpeza, garantindo a leveza visual da paleta clara.
- Cor de destaque: Lavanda suave (#A895DB), uma tonalidade análoga que harmoniza com o azul principal e adiciona um toque de modernidade sem ser intrusivo.
- Cores funcionais: Verde (#2E7D32) para indicações de sucesso, amarelo (#F9A825) para alertas e avisos, e vermelho (#C62828) para mensagens de erro, para um feedback visual instantâneo e claro.
- Fontes: Para cabeçalhos e elementos de UI importantes, a sans-serif 'Space Grotesk' (com um toque moderno e tecnológico). Para corpo de texto, a sans-serif 'Inter' (neutra e altamente legível) para máxima clareza na exibição de dados e relatórios.
- Ícones: Utilizar um conjunto de ícones no estilo Material Design para garantir uniformidade, clareza e fácil reconhecimento das ações e funcionalidades em toda a aplicação.
- Layout Responsivo e Navegação Intuitiva: Um design que se adapta perfeitamente a telas de desktop, tablet e dispositivos móveis. A navegação será facilitada por um sidebar em telas maiores e um menu deslizante (drawer) ou footer fixo para dispositivos menores.
- Animações e Feedback Visual: Animações suaves de transição entre seções para uma experiência de usuário fluida. O feedback visual para sucesso, erro e avisos será entregue por meio de SnackBar ou toast notifications com as cores funcionais apropriadas.