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
Cadastro e consulta de produtos;
Gestão de fornecedores;
Controle de entradas e saídas de estoque;
Rastreador por lote, série, nota fiscal e histórico;
Alertas de estoque mínimo e demanda prevista;
Autenticação com perfis de usuário;
Dashboard e relatórios consolidados;
Upload de imagens e arquivos relacionados aos produtos;
Ajustes manuais de estoque com controle de permissão;
Acesso em rede local para múltiplos usuários.

## Arquitetura do sistema
A estrutura do projeto está dividida em camadas:
Front-end: interface web em HTML, CSS e JavaScript;
Back-end: API REST com Express;
Persistência: banco SQLite;
Segurança: autenticação JWT e controle por perfil;
Armazenamento de arquivos: pasta uploads;
Testes: validação da API via Node.js test runner.