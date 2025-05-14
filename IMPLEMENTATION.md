# Guia de Implementação - Sistema de Agendamento de Disciplinas

Este documento descreve a arquitetura, componentes principais e fluxo de desenvolvimento do Sistema de Agendamento de Disciplinas para a UNISINOS.

## Visão Geral da Arquitetura

O sistema é dividido em duas partes principais:

1. **Backend**: API RESTful construída com Node.js, Express e MongoDB
2. **Frontend**: Interface de usuário desenvolvida com React e Bootstrap

### Stack Tecnológica

- **Backend**:
  - Node.js & Express.js
  - MongoDB (com Mongoose)
  - JSON Web Tokens (JWT) para autenticação
  - Passport.js com estratégia SAML para SSO
  - Nodemailer para envio de e-mails
  - Winston para logging

- **Frontend**:
  - React (com React Router)
  - Bootstrap & React-Bootstrap
  - Axios para requisições HTTP
  - Formik & Yup para validação de formulários
  - React-Toastify para notificações
  - Chart.js para visualizações

## Estrutura do Projeto

```
unisinos-scheduling-system/
├── src/
│   ├── api/              # API endpoints e middlewares
│   ├── models/           # Modelos de dados
│   ├── services/         # Serviços e lógica de negócios
│   ├── utils/            # Funções utilitárias
│   ├── config/           # Configurações do sistema
│   ├── frontend/         # Aplicação React
│   └── index.js          # Ponto de entrada da aplicação
├── .env                  # Variáveis de ambiente
└── package.json          # Dependências do projeto
```

## Fluxo do Sistema

### Autenticação

1. O usuário acessa o sistema e é redirecionado para o login
2. O sistema usa SAML para autenticar com o SSO institucional
3. Após autenticação bem-sucedida, um token JWT é gerado
4. O usuário é redirecionado para o dashboard de acordo com seu perfil (admin/professor/aluno)

### Fluxo do Administrador

1. Cadastro de disciplinas, campus e modalidades
   - Endpoint: POST /api/admin/subjects
   - Controller: AdminController.createSubject

2. Vinculação de professores e pré-requisitos
   - Endpoint: POST /api/admin/subjects/:id/professors
   - Endpoint: POST /api/admin/subjects/:id/prerequisites
   - Controller: AdminController.linkProfessorsToSubject, AdminController.addPrerequisites

3. Agendamento de envio de e-mails
   - Endpoint: POST /api/admin/emails/schedule
   - Controller: AdminController.scheduleEmail
   - Service: EmailService.scheduleEmail

4. Geração de sugestões de grade
   - Endpoint: POST /api/admin/schedule/suggest
   - Controller: AdminController.generateScheduleSuggestion
   - Service: ScheduleAIService.generateScheduleSuggestion

### Fluxo do Aluno

1. Acesso ao sistema via e-mail institucional (@edu.unisinos.br)
2. Visualização de disciplinas disponíveis
   - Endpoint: GET /api/students/subjects/available
   - Controller: StudentController.getAvailableSubjects

3. Registro de interesse em até 8 disciplinas
   - Endpoint: POST /api/students/interests
   - Controller: StudentController.registerInterest

### Fluxo do Professor

1. Acesso ao sistema via e-mail institucional (@unisinos.br)
2. Visualização de disciplinas atribuídas
   - Endpoint: GET /api/professors/subjects/assigned
   - Controller: ProfessorController.getAssignedSubjects

3. Registro de disponibilidade para ministrar aulas
   - Endpoint: POST /api/professors/availability
   - Controller: ProfessorController.registerAvailability

### Processamento de E-mails

1. O administrador agenda o envio de e-mails
2. O sistema processa as filas de e-mail periodicamente (a cada 15 minutos)
3. E-mails são enviados para alunos e professores com links personalizados

### Algoritmo de IA para Sugestão de Grade

A geração de sugestões de grade é implementada no `ScheduleAIService` e segue o seguinte processo:

1. Coleta de dados:
   - Interesses dos alunos
   - Disponibilidade dos professores
   - Disciplinas e pré-requisitos

2. Identificação de disciplinas viáveis:
   - Filtragem de disciplinas com pelo menos 10 alunos interessados
   - Análise de preferências de turnos dos alunos

3. Atribuição de professores:
   - Verificação de disponibilidade dos professores
   - Balanceamento de carga entre professores (máximo 10 disciplinas por professor)

4. Geração de horários:
   - Otimização baseada em preferências de alunos e professores
   - Evitar conflitos de horários para professores
   - Priorização de slots com maior preferência entre alunos

5. Cálculo de pontuação:
   - Avaliação da qualidade da grade com base em vários fatores
   - Pontuação de 0-100 considerando cobertura de disciplinas, balanceamento de carga e satisfação de preferências

## Próximos Passos para Desenvolvimento

### Fase 1: Configuração do Projeto e Modelos de Dados

1. ✅ Configurar projeto Node.js e Express
2. ✅ Implementar modelos de dados no MongoDB
3. ✅ Configurar autenticação JWT e SAML SSO

### Fase 2: Implementação de APIs e Serviços

1. ✅ Desenvolver endpoints para administrador
2. ✅ Implementar serviço de e-mail
3. ✅ Implementar algoritmo de sugestão de grade

### Fase 3: Desenvolvimento do Frontend

1. ✅ Configurar projeto React
2. ✅ Implementar fluxo de autenticação
3. ✅ Criar interfaces para admin, alunos e professores

### Fase 4: Aprimoramentos Futuros

1. [ ] Melhorar algoritmo de IA com aprendizado de máquina mais avançado
2. [ ] Adicionar relatórios e visualizações para administradores
3. [ ] Implementar notificações em tempo real
4. [ ] Adicionar testes automatizados para backend e frontend
5. [ ] Integrar com calendário institucional

## Configuração e Implantação

### Requisitos de Ambiente

- Node.js 16+
- MongoDB 4.4+
- Servidor SMTP para envio de e-mails
- Provedor de identidade SAML (SSO institucional)

### Configuração de Ambiente

1. Clone o repositório
2. Instale as dependências com `npm install`
3. Configure as variáveis de ambiente no arquivo `.env`
4. Inicie o banco de dados MongoDB
5. Execute o servidor de desenvolvimento com `npm run dev`

### Configuração de Produção

1. Configure variáveis de ambiente para produção
2. Construa o frontend com `cd src/frontend && npm run build`
3. Utilize PM2 ou similar para gerenciar o processo Node.js
4. Configure proxy reverso (Nginx/Apache) para servir o aplicativo
5. Configure HTTPS para segurança

## Conclusão

O Sistema de Agendamento de Disciplinas representa uma solução completa para gerenciar o processo de coleta de interesses de alunos, disponibilidade de professores e geração automatizada de sugestões de grade. A arquitetura modular permite fácil manutenção e extensão, enquanto a integração com o sistema SSO institucional garante uma experiência de usuário integrada. 