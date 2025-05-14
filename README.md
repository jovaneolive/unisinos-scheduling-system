# Sistema de Agendamento de Disciplinas - Unisinos

Um sistema para coletar o interesse dos alunos nas disciplinas, a disponibilidade dos professores e gerar sugestões de grade horária utilizando inteligência artificial.

## Estrutura do Projeto

```
unisinos-scheduling-system/
├── src/
│   ├── api/              # Endpoints e controle de rotas
│   ├── models/           # Modelos de dados
│   ├── services/         # Lógica de negócios
│   ├── utils/            # Funções utilitárias
│   ├── config/           # Configurações do sistema
│   └── frontend/         # Interface do usuário
├── .env                  # Variáveis de ambiente (não versionado)
├── package.json          # Dependências do projeto
└── README.md             # Documentação
```

## Requisitos

- Node.js >= 16.0.0
- MongoDB
- Conta de e-mail para envio de notificações

## Configuração

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Crie um arquivo `.env` baseado no `.env.example`
4. Inicie o banco de dados MongoDB
5. Execute o projeto: `npm run dev`

## Principais Funcionalidades

### Administrador
- Cadastro de disciplinas
- Cadastro de campus e modalidades
- Cadastro de pré-requisitos
- Vinculação de professores a disciplinas
- Agendamento de envio de e-mails
- Visualização de relatórios e sugestões de grade

### Alunos
- Login via SSO institucional
- Visualização de disciplinas disponíveis
- Registro de interesse em disciplinas
- Indicação de disponibilidade de horários

### Professores
- Login via SSO institucional
- Visualização de disciplinas vinculadas
- Registro de disponibilidade para ministrar aulas
- Indicação de preferências de horários

### Sistema
- Envio automático de e-mails
- Verificação de pré-requisitos
- Geração de sugestões de grade utilizando IA
- Geração de relatórios

## Implementação de IA

O sistema utiliza técnicas de otimização e aprendizado de máquina para gerar sugestões de grade horária, considerando:

1. Interesse dos alunos
2. Disponibilidade dos professores
3. Restrições de pré-requisitos
4. Histórico de matrículas
5. Padrões de demanda de disciplinas

## Licença

Este projeto é propriedade da Universidade do Vale do Rio dos Sinos - UNISINOS. 