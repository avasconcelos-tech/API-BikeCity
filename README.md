# BikeCity — Sistema de Estoque e Logística

Implementação alinhada ao documento de requisitos enviado para o projeto BikeCity.

## Executar

```bash
npm install
npm test
npm start
```

Abra `http://localhost:3000/login.html`.

Usuário inicial de desenvolvimento: `gerente@teste.com` / `senha123`.

## Funcionalidades implementadas

- Gestão de produtos com código interno, categoria, unidade, fornecedor, custo, localização, montagem e demanda prevista.
- Entrada com fornecedor, nota fiscal, pedido de compra, transporte e rastreabilidade.
- Bateria: número de série + validade.
- Motor/controlador: número de série + lote.
- Bicicleta/patinete: ID único.
- Freios/pneus: lote.
- Saída com destinação, motivo, pedido de venda, transporte e montagem/desmontagem.
- Alertas de estoque mínimo/demanda prevista.
- Histórico e rastreabilidade de movimentações.
- Devolução de cliente/fornecedor e reaproveitamento condicionado ao estado.
- Ajuste manual restrito ao perfil GERENTE e auditado.
- Relatórios consolidados.
- Usuários com perfis OPERACIONAL, ANALISTA e GERENTE.
- Bloqueio após 3 falhas de login e JWT de 30 minutos.
- Expiração por 30 minutos de inatividade no front-end.
- Consulta de produto por código interno/código de barras.
- Notificações para setores de Compras e Logística quando o estoque fica baixo.
- Interface responsiva para desktop, tablet e mobile.

## Testes

A suíte atual contém 24 testes e foi validada com 24/24 aprovados.

## Acesso por vários computadores na mesma rede

O servidor agora escuta em `0.0.0.0:3000` e o front-end identifica automaticamente o endereço do computador que está hospedando a aplicação.

No computador servidor:

```bash
npm install
npm start
```

Use no computador dos colegas o IPv4 exibido pelo terminal, por exemplo:

```text
http://192.168.1.15:3000/login.html
```

Não use `localhost`/`127.0.0.1` no computador do colega. Se o Firewall do Windows bloquear a porta, execute `liberar-porta-3000-firewall.bat` como administrador.
