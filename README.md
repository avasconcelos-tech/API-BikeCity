# BikeCity

Sistema de gestão de estoque, compras, logística e rastreabilidade para bicicletas, patinetes e peças de mobilidade urbana.

## Desenvolvedores

- Ana Katy Romão Vasconcelos
- Gabriela Carnevali Gonçalves Lima
- João Marcos Ferreira Benevides
- Mateus Lopes Ferreira

## Visão geral

O BikeCity foi desenvolvido para controlar de forma centralizada o ciclo de movimentação de produtos em um ambiente de mobilidade urbana. O sistema permite registrar entradas, saídas, alertas de estoque, usuários, fornecedores e relatórios operacionais, com foco em rastreabilidade e organização do processo logístico.

A aplicação combina backend em Node.js, banco de dados SQLite e interface web para uso interno, sendo adequada para ambientes locais ou rede corporativa.

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
- Persistência: banco SQLite;
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
- SQLite
- JWT
- bcryptjs
- Multer
- CORS
- HTML, CSS e JavaScript
- Supertest

## Requisitos

- Node.js 22 ou superior
- npm
- Compatível com Windows, macOS e Linux

## Como executar

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` na raiz do projeto e defina um segredo JWT:

```dotenv
JWT_SECRET=defina-um-segredo-longo-e-aleatorio
PORT=5500
```

3. Inicie a aplicação:

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
- `POST /api/v1/uploads/imagens`

## Testes

Os testes carregam as variáveis do arquivo `.env.test` e usam `back-end/database.test.sqlite`, separado do banco de desenvolvimento. Esse arquivo de banco é local e ignorado pelo Git.

```bash
npm test
```

## Observações complementares

O BikeCity é uma solução prática para gestão interna de estoque e logística, com foco em rastreabilidade, operação organizada e suporte à tomada de decisão. A estrutura atual permite evolução para integrações, relatórios mais avançados e novas funcionalidades conforme a demanda da organização.

## Licença

Este projeto está em desenvolvimento e foi estruturado como solução interna para gestão operacional. Ajustes de licença devem ser definidos conforme o uso final e a política da organização.