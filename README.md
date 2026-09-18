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
