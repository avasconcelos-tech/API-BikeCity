# BikeCity

Sistema de gestão de estoque, compras, logística e rastreabilidade para bicicletas, patinetes e peças de mobilidade urbana.

## Desenvolvedores

- Ana Katy Romão Vasconcelos
- Gabriela Carnevali Gonçalves Lima
- João Marcos Ferreira Benevides
- Mateus Lopes Ferreira

## Visão geral
O BikeCity foi desenvolvido para controlar de forma centralizada o ciclo de movimentação de produtos em um ambiente de mobilidade urbana. O sistema permite registrar entradas, saídas, alertas de estoque, usuários, fornecedores e relatórios operacionais, com foco em rastreabilidade e organização do processo logística.
A aplicação combina backend em Node.js, banco de dados SQLite e interface web para uso interno, sendo adequada para ambientes locais ou rede corporativa.

## Serviço Proposto
Empresas que administram bicicletas, patinetes e peças de reposição frequentemente enfrentam dificuldades para:
controlar quantitativos de estoque em tempo real;
acompanhar itens por lote, série e histórico de movimentação;
evitar falhas na reposição de produtos;
manter a operação segura por perfil de acesso;
reduzir erros em entradas e saídas de mercadorias.
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
Front-end: interface web em HTML, CSS e JavaScript;
Back-end: API REST com Express;
Persistência: banco SQLite;
Segurança: autenticação JWT e controle por perfil;
Armazenamento de arquivos: pasta uploads;
Testes: validação da API via Node.js test runner.

## Estrutura do projeto
text
API-BikeCity/
├── back-end/
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── configuracoes/
│       ├── controladores/
│       ├── repositorios/
│       ├── rotas/
│       ├── servicos/
│       └── tests/
├── front-end/
│   ├── ativos/
│   ├── js/
│   ├── dashboard.html
│   ├── estoque.html
│   ├── login.html
│   ├── produtos.html
│   ├── relatorios.html
│   └── usuarios.html
├── uploads/
├── package.json
├── README.md
├── README_REDE_LOCAL.md
├── documentação.md
├── iniciar-rede.bat
├── liberar-porta-3000-firewall.bat
├── database.sqlite
└── Db_bikecity.sqlite.sql

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
Node.js 18 ou superior
npm
Ambiente Windows recomendado para uso local e rede interna

## Como executar
1. Instale as dependências:
bash
npm install
2. Inicie a aplicação:
bash
npm start
3. Acesse a interface no navegador:
text
http://localhost:3000/login.html

## Usuário de Teste
E-mail: gerente@teste.com
Senha: senha123

## Endpoints Principais
GET /
POST /api/v1/auth/login
GET /api/v1/produtos
POST /api/v1/produtos
GET /api/v1/estoque
POST /api/v1/estoque/entrada
POST /api/v1/estoque/saida
GET /api/v1/dashboard/resumo
POST /api/v1/uploads

## Testes
bash
npm test## Status atual
A validação do projeto aponta 23 testes aprovados e 1 falha pendente relacionada à configuração do JWT_SECRET no ambiente. Isso indica a necessidade de padronizar a variável de ambiente para uso em desenvolvimento e produção.

## Observações Conplementares
O BikeCity é uma solução prática para gestão interna de estoque e logística, com foco em rastreabilidade, operação organizada e suporte à tomada de decisão. A estrutura atual permite evolução para integrações, relatórios mais avançados e novas funcionalidades conforme a demanda da organização.

## Licença
Este projeto está em desenvolvimento e foi estruturado como solução interna para gestão operacional,ajustes de licença devem ser definidos conforme o uso final e a política da organização.