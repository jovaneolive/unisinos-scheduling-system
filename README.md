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

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Supabase Integration](#supabase-integration)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Overview
The Unisinos Scheduling System is designed to help manage university course scheduling, student enrollments, professor assignments, and classroom allocations.

## Features
- User authentication (admin, professor, student roles)
- Department management
- Course management
- Classroom scheduling
- Student enrollment
- Schedule conflict resolution
- Notification system

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Git

### Setup
1. Clone the repository:
```
git clone https://github.com/yourusername/unisinos-scheduling-system.git
cd unisinos-scheduling-system
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
# Supabase credentials
SUPABASE_URL=https://acrpnbgpfrirfsdecipt.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
DATABASE_URL=postgresql://postgres:99147Jov@@db.acrpnbgpfrirfsdecipt.supabase.co:5432/postgres

# App settings
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
```

4. Start the development server:
```
npm run dev
```

## Supabase Integration

This project uses Supabase as its database provider. The system is configured to automatically create the necessary tables when it starts for the first time.

### Database Schema

The following tables will be created in your Supabase project:

1. **users** - Store user information (admin, professors, students)
2. **departments** - Academic departments
3. **courses** - Course information linked to departments
4. **classrooms** - Available classroom information
5. **time_slots** - Define available time slots
6. **course_offerings** - Specific course offerings for a semester
7. **schedules** - Link between course offerings, time slots, and classrooms
8. **enrollments** - Student enrollments in course offerings

### Supabase Setup

1. Go to [Supabase](https://supabase.com/) and sign in to your account
2. Create a new project if you haven't already
3. Get your project URL and anon key from the API settings
4. Update your `.env` file with these credentials
5. The application will automatically create the necessary tables on first run

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get JWT token
- `GET /api/users/me` - Get current user info

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create new department (admin only)
- `PUT /api/departments/:id` - Update department (admin only)
- `DELETE /api/departments/:id` - Delete department (admin only)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/department/:departmentId` - Get courses by department
- `POST /api/courses` - Create new course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)

## Licença

Este projeto é propriedade da Universidade do Vale do Rio dos Sinos - UNISINOS. 