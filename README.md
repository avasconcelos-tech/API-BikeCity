# BikeCity

Sistema de gestão de estoque, compras, logística e rastreabilidade para bicicletas, patinetes e peças de mobilidade urbana.

## Desenvolvedores

- Ana Katy Romão Vasconcelos
- Gabriela Carnevali Gonçalves Lima
- João Marcos Ferreira Benevides
- Mateus Lopes Ferreira

## Visão geral

O BikeCity foi desenvolvido para controlar de forma centralizada o ciclo de movimentação de produtos em um ambiente de mobilidade urbana. O sistema permite registrar entradas, saídas, alertas de estoque, usuários, fornecedores e relatórios operacionais, com foco em rastreabilidade e organização do processo logístico.

A aplicação combina backend em Node.js, banco de dados MySQL/MariaDB e interface web para uso interno, sendo adequada para ambientes locais ou rede corporativa.

## Serviço proposto

Empresas que administram bicicletas, patinetes e peças de reposição frequentemente enfrentam dificuldades para:

- controlar quantitativos de estoque em tempo real;
- acompanhar itens por lote, série e histórico de movimentação;
- evitar falhas na reposição de produtos;
- manter a operação segura por perfil de acesso;
- reduzir erros em entradas e saídas de mercadorias.

O BikeCity organiza esses processos em uma solução única, oferecendo rastreabilidade e visibilidade para operação e gestão.

## Funcionalidades principais

- Cadastro e consulta de produtos;
- Gestão de fornecedores;
- Controle de entradas e saídas de estoque;
- Rastreador por lote, série, nota fiscal e histórico;
- Alertas de estoque mínimo e demanda prevista;
- Autenticação com perfis de usuário;
- Dashboard e relatórios consolidados;
- Upload de imagens e arquivos relacionados aos produtos;
- Ajustes manuais de estoque com controle de permissão;
- Acesso em rede local para múltiplos usuários.

## Arquitetura do sistema

A estrutura do projeto está dividida em camadas:

- Front-end: interface web em HTML, CSS e JavaScript;
- Back-end: API REST com Express;
- Persistência: banco MySQL/MariaDB;
- Segurança: autenticação JWT e controle por perfil;
- Armazenamento de arquivos: pasta uploads;
- Testes: validação da API via Node.js test runner.

## Estrutura do projeto

```text
API-BikeCity/
├── back-end/
│   ├── src/
│   ├── tests/
│   └── uploads/
├── front-end/
│   ├── ativos/
│   ├── js/
│   ├── dashboard.html
│   ├── estoque.html
│   ├── login.html
│   ├── produtos.html
│   ├── relatorios.html
│   └── usuarios.html
├── .env.test
├── package.json
├── README.md
└── documentação.md
```

## Tecnologias utilizadas

- Node.js
- Express.js
- MySQL 8.0+ ou MariaDB 10.3+
- JWT
- bcryptjs
- Multer
- CORS
- HTML, CSS e JavaScript
- Supertest

## Requisitos

- Node.js 22.5 ou superior
- npm
- Compatível com Windows, macOS e Linux

## Como executar

1. Instale as dependências:

```bash
npm install
```

2. Crie o banco e o usuário da aplicação no MySQL/MariaDB (substitua a senha de exemplo):

```sql
CREATE DATABASE bikecity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bikecity'@'localhost' IDENTIFIED BY 'substitua-esta-senha';
GRANT ALL PRIVILEGES ON bikecity.* TO 'bikecity'@'localhost';
```

3. Copie `.env.example` para `.env` e configure o segredo JWT e as credenciais do banco:

```dotenv
JWT_SECRET=defina-um-segredo-longo-e-aleatorio
PORT=5500
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=bikecity
DB_PASSWORD=substitua-esta-senha
DB_NAME=bikecity
```

No primeiro início, a aplicação instala o esquema idempotente de `back-end/sql/schema.sql`. A carga de demonstração em `back-end/sql/seed.sql` só é executada em `development` e `test`; não é carregada em produção. O usuário demonstrativo é `gerente@teste.com` / `senha123` e deve ser removido ou ter a senha alterada em ambientes não locais.

4. Inicie a aplicação:

```bash
npm start
```

4. Acesse a interface no navegador. A porta padrão é `5500`; ela pode ser alterada pela variável `PORT`:

```text
http://localhost:5500/login.html
```

## Usuário de teste

- E-mail: gerente@teste.com
- Senha: senha123

## Endpoints principais

- `GET /`
- `POST /api/v1/auth/login`
- `GET /api/v1/produtos`
- `POST /api/v1/produtos`
- `GET /api/v1/fornecedores`
- `GET /api/v1/estoque/movimentacoes`
- `POST /api/v1/estoque/entradas`
- `POST /api/v1/estoque/saidas`
- `GET /api/v1/dashboard/resumo`
- `POST /api/v1/uploads/imagens` (envie `produto_id` como campo do formulário)

## Testes

Os testes carregam `.env.test` e usam um banco MySQL/MariaDB separado, `bikecity_test`. Crie o banco antes de executá-los e configure credenciais de teste nesse arquivo:

```sql
CREATE DATABASE bikecity_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bikecity_test'@'localhost' IDENTIFIED BY 'defina-uma-senha-de-teste';
GRANT ALL PRIVILEGES ON bikecity_test.* TO 'bikecity_test'@'localhost';
```

O usuário configurado precisa poder criar tabelas e índices no banco de teste. Não use o banco de produção para testes: cada caso apaga e recria os dados de demonstração.

```bash
npm test
```

## Observações complementares

O BikeCity é uma solução prática para gestão interna de estoque e logística, com foco em rastreabilidade, operação organizada e suporte à tomada de decisão. A estrutura atual permite evolução para integrações, relatórios mais avançados e novas funcionalidades conforme a demanda da organização.

## Licença

Este projeto está em desenvolvimento e foi estruturado como solução interna para gestão operacional. Ajustes de licença devem ser definidos conforme o uso final e a política da organização.