# 📚 Documentação da API — BikeCity

## 📌 1. Visão Geral & Configurações Globais

* **URL Base:** `/api/v1`
* **Formato de Payload:** `application/json` (com suporte a `multipart/form-data` no módulo de uploads)
* **Porta Padrão:** `3000`

### Mapeamento de Prefixos de Rotas

| Recurso          | Prefixo de Rota        | Descrição                          |
| ---------------- | ---------------------- | ---------------------------------- |
| **Autenticação** | `/api/v1/auth`         | Login e validação de sessão        |
| **Usuários**     | `/api/v1/usuarios`     | Gestão de usuários do sistema      |
| **Produtos**     | `/api/v1/produtos`     | Cadastro e catálogo de produtos    |
| **Fornecedores** | `/api/v1/fornecedores` | Gestão de fornecedores parceiros   |
| **Estoque**      | `/api/v1/estoque`      | Movimentações, alertas e auditoria |
| **Uploads**      | `/api/v1/uploads`      | Envio de arquivos e imagens        |

### Tratamento de Erros Padrão

Quando ocorre um erro interno (status HTTP `500`), a API retorna:

```json
{
  "status": "erro",
  "mensagem": "Erro interno do servidor"
}
```

---

# 🗄️ 2. Dicionário do Banco de Dados (`db_bikecity`)

## Tabela: `usuarios`

Armazena as contas de usuário do sistema e controle de acesso.

| Campo               | Tipo         | Nulo | Chave | Padrão         | Observações                                 |
| ------------------- | ------------ | ---- | ----- | -------------- | ------------------------------------------- |
| `id`                | INT          | NÃO  | PK    | Auto-increment | Identificador único                         |
| `nome`              | VARCHAR(150) | NÃO  |       |                | Nome completo                               |
| `email`             | VARCHAR(150) | NÃO  |       | Unique         | E-mail de acesso                            |
| `senha_hash`        | VARCHAR(255) | NÃO  |       |                | Hash da senha do usuário                    |
| `cargo`             | VARCHAR(50)  | NÃO  |       |                | Cargo na empresa                            |
| `perfil`            | VARCHAR(50)  | NÃO  |       |                | Perfil de permissão (ex: Admin, Operador)   |
| `ativo`             | TINYINT(1)   | NÃO  |       | 1              | Status do usuário (1 = Ativo, 0 = Inativo)  |
| `tentativas_falhas` | INT          | NÃO  |       | 0              | Contador de tentativas de login incorretas  |
| `bloqueado_until`   | DATETIME     | SIM  |       | NULL           | Data/Hora até onde o usuário está bloqueado |

## Tabela: `fornecedores`

Armazena as informações dos fornecedores de produtos.

| Campo     | Tipo         | Nulo | Chave | Padrão         | Observações                  |
| --------- | ------------ | ---- | ----- | -------------- | ---------------------------- |
| `id`      | INT          | NÃO  | PK    | Auto-increment | Identificador único          |
| `nome`    | VARCHAR(150) | NÃO  |       |                | Razão Social / Nome Fantasia |
| `cnpj`    | VARCHAR(14)  | SIM  | Unique|                | CNPJ validado, armazenado em formato canônico |
| `contato` | VARCHAR(100) | SIM  |       |                | Telefone / E-mail de contato |
| `ativo`   | TINYINT(1)   | NÃO  |       | 1              | Status do fornecedor         |

## Tabela: `produtos`

Catálogo de itens e bicicletas cadastrados no sistema.

| Campo                  | Tipo          | Nulo | Chave | Padrão         | Observações                                          |
| ---------------------- | ------------- | ---- | ----- | -------------- | ---------------------------------------------------- |
| `id`                   | INT           | NÃO  | PK    | Auto-increment | Identificador único                                  |
| `nome`                 | VARCHAR(150)  | NÃO  |       |                | Nome do produto                                      |
| `codigo_interno`       | VARCHAR(50)   | NÃO  |       | Unique         | SKU / Código de barras interno                       |
| `categoria`            | VARCHAR(50)   | NÃO  |       |                | Categoria do produto                                 |
| `unidade_medida`       | VARCHAR(20)   | NÃO  |       |                | Ex: UN, KG, CX                                       |
| `localizacao_deposito` | VARCHAR(100)  | NÃO  |       |                | Setor/Prateleira no depósito                         |
| `fornecedor_id`        | INT           | SIM  | FK    | NULL           | Relaciona com `fornecedores.id` (ON DELETE SET NULL) |
| `custo`                | DECIMAL(10,2) | NÃO  |       |                | Custo unitário de aquisição                          |
| `dimensoes`            | VARCHAR(100)  | SIM  |       |                | Altura x Largura x Profundidade / Peso               |
| `estoque_atual`        | INT           | NÃO  |       | 0              | Quantidade física disponível                         |
| `estoque_minimo`       | INT           | NÃO  |       | 5              | Ponto de pedido / limite para alerta                 |
| `estado_montagem`      | VARCHAR(50)   | NÃO  |       |                | Ex: Montado, Desmontado                              |
| `imagem_url`           | VARCHAR(255)  | SIM  |       |                | URL / Caminho da imagem                              |
| `ativo`                | TINYINT(1)    | NÃO  |       | 1              | Status do produto                                    |

## Tabela: `movimentacoes`

Histórico de entradas, saídas e transferências de estoque.

| Campo                | Tipo         | Nulo | Chave | Padrão            | Observações                               |
| -------------------- | ------------ | ---- | ----- | ----------------- | ----------------------------------------- |
| `id`                 | INT          | NÃO  | PK    | Auto-increment    | Identificador único                       |
| `produto_id`         | INT          | NÃO  | FK    |                   | Relaciona com `produtos.id`               |
| `usuario_id`         | INT          | SIM  | FK    | NULL              | Usuário responsável; definido como NULL se removido |
| `tipo`               | VARCHAR(50)  | NÃO  |       |                   | Ex: Entrada, Saída, Devolução             |
| `quantidade`         | INT          | NÃO  |       |                   | Quantidade movimentada                    |
| `data_movimentacao`  | DATETIME     | NÃO  |       | CURRENT_TIMESTAMP | Data/hora do registro                     |
| `numero_nota_fiscal` | VARCHAR(50)  | SIM  |       |                   | Número da NF vinculada                    |
| `numero_pedido`      | VARCHAR(50)  | SIM  |       |                   | Número do pedido associado                |
| `destinatario`       | VARCHAR(150) | SIM  |       |                   | Cliente / Destino do material             |
| `motivo`             | VARCHAR(255) | SIM  |       |                   | Motivo da movimentação                    |
| `fornecedor_id`      | INT          | SIM  | FK    |                   | Opcional, relaciona com `fornecedores.id` |
| `tipo_transporte`    | VARCHAR(50)  | SIM  |       |                   | Ex: Transportadora, Retirada              |

## Tabela: `alertas`

Registra notificações atreladas a produtos, como estoque crítico.

| Campo        | Tipo | Nulo | Chave | Padrão         | Observações                                     |
| ------------ | ---- | ---- | ----- | -------------- | ----------------------------------------------- |
| `id`         | INT  | NÃO  | PK    | Auto-increment | Identificador único                             |
| `produto_id` | INT  | NÃO  | FK    |                | Relaciona com `produtos.id`; impede exclusão física do produto |
| `mensagem`   | TEXT | NÃO  |       |                | Descrição do alerta                             |

## Tabela: `auditoria`

Log de alterações manuais e contagens de inventário.

| Campo           | Tipo     | Nulo | Chave | Padrão         | Observações                    |
| --------------- | -------- | ---- | ----- | -------------- | ------------------------------ |
| `id`            | INT      | NÃO  | PK    | Auto-increment | Identificador único            |
| `produto_id`    | INT      | SIM  | FK    | NULL           | Relaciona com `produtos.id`; definido como NULL se removido |
| `usuario_id`    | INT      | SIM  | FK    | NULL           | Relaciona com `usuarios.id`; definido como NULL se removido |
| `antigo_valor`  | INT      | NÃO  |       |                | Quantidade de estoque anterior |
| `novo_valor`    | INT      | NÃO  |       |                | Nova quantidade ajustada       |
| `justificativa` | TEXT     | SIM  |       |                | Motivo da alteração manual     |
| `data`          | DATETIME | NÃO  |       |                |                                |

### Integridade referencial e migrações do SQLite

O SQLite é inicializado com `PRAGMA foreign_keys = ON`. Produtos, movimentações, rastreabilidade, alertas, auditoria, devoluções e notificações validam suas referências a produtos, usuários, fornecedores e movimentações. Referências opcionais usam `ON DELETE SET NULL`; referências obrigatórias preservam o histórico e impedem a exclusão física do registro relacionado. O sistema utiliza inativação lógica para produtos, fornecedores e usuários.

As versões aplicadas ficam registradas em `schema_versao`. Novas migrações devem ser adicionadas em `back-end/src/repositorios/migracoes/` com nome numérico sequencial (por exemplo, `003_nome_da_migracao.js`) e exportar `up(db)`. Cada migração é executada em transação e sua versão só é gravada após sucesso. A migração das FKs aborta com a identificação dos registros órfãos encontrados, sem removê-los.

---

# 🔐 Módulo 2: Autenticação e Usuários

Este módulo gerencia a autenticação dos usuários, geração de tokens JWT, controle de tentativas de login, bloqueio temporário e o CRUD completo de usuários com permissão baseada em perfis.

## 🛡️ Regras Globais de Autenticação & Segurança

1. **Header de Autorização**

   Todas as rotas protegidas exigem:

   ```http
   Authorization: Bearer <seu_token_jwt>
   ```

2. **Tempo de Expiração do Token:** `30 minutos`.

3. **Payload do JWT:**

   ```json
   {
     "id": 1,
     "perfil": "GERENTE",
     "email": "usuario@bikecity.com"
   }
   ```

4. **Perfis de Acesso (RBAC)**

   * Apenas usuários com perfil `GERENTE` possuem permissão para realizar operações de gestão de usuários: listar, criar, editar e desativar.
   * Usuários comuns têm acesso apenas às suas próprias configurações, como alteração de senha.

5. **Regra de Bloqueio de Login**

   * Ao atingir 3 tentativas de login malsucedidas, a conta é temporariamente bloqueada por 15 minutos (`bloqueado_until`).
   * Respostas de login durante o bloqueio retornam status `403 Forbidden`.

---

## 🔑 Endpoints de Autenticação (`/api/v1/auth`)

### 1. Fazer Login

* **Rota:** `POST /api/v1/auth/login`
* **Acesso:** Público
* **Descrição:** Autentica o usuário e retorna o token de acesso Bearer JWT.

#### Body da Requisição

```json
{
  "email": "gerente@bikecity.com",
  "senha": "senhaSegura123"
}
```

#### Respostas HTTP

##### 🟢 200 OK — Login realizado com sucesso

```json
{
  "status": "sucesso",
  "mensagem": "Login realizado com sucesso",
  "dados": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

##### 🔴 401 Unauthorized — Credenciais inválidas

```json
{
  "status": "erro",
  "mensagem": "Credenciais inválidas"
}
```

##### 🔴 403 Forbidden — Conta temporariamente bloqueada

```json
{
  "status": "erro",
  "mensagem": "Conta temporariamente bloqueada"
}
```

---

# 👥 Endpoints de Usuários (`/api/v1/usuarios`)

## 1. Listar Usuários

* **Rota:** `GET /api/v1/usuarios`
* **Acesso:** Autenticado
* **Permissão:** `GERENTE`

### Query Parameters

* `incluirInativos` (opcional, boolean): Se `true`, retorna usuários ativos e desativados. Por padrão (`false`), retorna apenas usuários ativos (`ativo = 1`).

**Exemplo:**

```http
GET /api/v1/usuarios?incluirInativos=true
```

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 1,
      "nome": "Carlos Silva",
      "email": "carlos@bikecity.com",
      "cargo": "Gerente de Operações",
      "perfil": "GERENTE",
      "ativo": true
    },
    {
      "id": 2,
      "nome": "Ana Souza",
      "email": "ana@bikecity.com",
      "cargo": "Atendente",
      "perfil": "OPERACIONAL",
      "ativo": true
    }
  ]
}
```

## 2. Buscar Usuário por ID

* **Rota:** `GET /api/v1/usuarios/:id`
* **Acesso:** Autenticado
* **Permissão:** `GERENTE`

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "dados": {
    "id": 2,
    "nome": "Ana Souza",
    "email": "ana@bikecity.com",
    "cargo": "Atendente",
    "perfil": "OPERACIONAL",
    "ativo": true,
    "tentativas_falhas": 0,
    "bloqueado_until": null
  }
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Usuário não encontrado"
}
```

## 3. Cadastrar Usuário

* **Rota:** `POST /api/v1/usuarios`
* **Acesso:** Autenticado
* **Permissão:** `GERENTE`

### Body da Requisição

```json
{
  "nome": "João Pedro",
  "email": "joao@bikecity.com",
  "senha": "senhaForte123",
  "cargo": "Mecânico",
  "perfil": "OPERACIONAL"
}
```

`nome`, `email` e `perfil` são obrigatórios. O e-mail deve ter formato válido, a senha deve possuir no mínimo 6 caracteres e `perfil` aceita somente `OPERACIONAL`, `ANALISTA` ou `GERENTE`. `cargo` é um texto descritivo livre e opcional.

### Resposta — 201 Created

```json
{
  "status": "sucesso",
  "mensagem": "Usuário cadastrado com sucesso",
  "dados": {
    "id": 3
  }
}
```

### Resposta — 409 Conflict

```json
{
  "status": "erro",
  "mensagem": "E-mail já cadastrado"
}
```

Campos inválidos retornam `400 Bad Request`.

## 4. Atualizar Usuário

* **Rota:** `PUT /api/v1/usuarios/:id`
* **Acesso:** Autenticado
* **Permissão:** `GERENTE`
* **Observação:** Permite atualização parcial dos campos `nome`, `email`, `cargo` e `perfil`. Não altera a senha por esta rota.
* **Validação:** O e-mail e o perfil devem ser válidos; `cargo` é texto descritivo livre.

### Body da Requisição

```json
{
  "nome": "João Pedro Santos",
  "cargo": "Mecânico Chefe"
}
```

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "mensagem": "Usuário atualizado com sucesso",
  "dados": {
    "id": 3,
    "nome": "João Pedro Santos",
    "email": "joao@bikecity.com",
    "cargo": "Mecânico Chefe",
    "perfil": "OPERACIONAL",
    "ativo": true
  }
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Usuário não encontrado"
}
```

`400 Bad Request` indica campo inválido; `409 Conflict` indica e-mail já cadastrado ou tentativa de remover o perfil do último gerente ativo.

## 5. Desativar Usuário

* **Rota:** `DELETE /api/v1/usuarios/:id`
* **Acesso:** Autenticado
* **Permissão:** `GERENTE`
* **Observação:** Realiza um *soft delete*, alterando a flag `ativo` para `false`/`0`.
* **Regra:** Não é permitido desativar a própria conta nem o último gerente ativo.

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "mensagem": "Usuário desativado com sucesso",
  "dados": {
    "id": 3,
    "nome": "João Pedro Santos",
    "email": "joao@bikecity.com",
    "cargo": "Mecânico Chefe",
    "perfil": "OPERACIONAL",
    "ativo": false
  }
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Usuário não encontrado"
}
```

`400 Bad Request` é retornado para tentativa de desativação da própria conta; `409 Conflict` é retornado ao tentar desativar o último gerente ativo.

## 6. Reativar Usuário

* **Rota:** `PATCH /api/v1/usuarios/:id/reativar`
* **Acesso:** Autenticado
* **Permissão:** `GERENTE`

`PATCH /api/v1/usuarios/:id/ativar` permanece disponível como alias.

## 7. Redefinir Senha de Outro Usuário

* **Rota:** `PATCH /api/v1/usuarios/:id/senha`
* **Acesso:** Autenticado
* **Permissão:** `GERENTE`

### Body da Requisição

```json
{
  "novaSenha": "senhaTemporaria123"
}
```

A nova senha deve possuir no mínimo 6 caracteres e é armazenada com hash.

## 8. Trocar a Própria Senha

* **Rota:** `PATCH /api/v1/usuarios/me/senha`
* **Acesso:** Autenticado, qualquer perfil logado
* **Regra:** O ID é extraído do token JWT (`req.user.id`). A nova senha deve possuir no mínimo 6 caracteres.

### Body da Requisição

```json
{
  "senhaAtual": "senhaAntiga123",
  "novaSenha": "novaSenhaSegura456"
}
```

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "mensagem": "Senha alterada com sucesso",
  "dados": {
    "senha_alterada": true
  }
}
```

### Resposta — 400 Bad Request

Senha incorreta:

```json
{
  "status": "erro",
  "mensagem": "Senha atual incorreta"
}
```

Nova senha inválida:

```json
{
  "status": "erro",
  "mensagem": "A nova senha deve ter pelo menos 6 caracteres"
}
```

### Resposta — 401 Unauthorized

```json
{
  "status": "erro",
  "mensagem": "Token inválido"
}
```

---

# 📦 Módulo 3: Produtos, Fornecedores e Uploads

Este módulo gerencia o catálogo de produtos, o cadastro de fornecedores e o envio de arquivos/imagens de produtos para o sistema.

## 🛡️ Controle de Permissões (RBAC)

* **`OPERACIONAL`**: Permissão de leitura (Listar e Buscar) em Produtos e Fornecedores. Permissão de Uploads genéricos.
* **`ANALISTA`** e **`GERENTE`**: Acesso completo para Criar, Atualizar, Inativar e Vincular Imagens.

---

# 🏬 1. Endpoints de Fornecedores (`/api/v1/fornecedores`)

## 1.1. Listar Fornecedores

* **Rota:** `GET /api/v1/fornecedores`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`

### Query Parameters

* `incluirInativos` (boolean, opcional): Se `true`, inclui fornecedores inativos.

**Exemplo:**

```http
GET /api/v1/fornecedores?incluirInativos=true
```

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 1,
      "nome": "Caloi Distribuidora S/A",
      "cnpj": "11222333000181",
      "contato": "vendas@caloi.com",
      "ativo": true
    }
  ]
}
```

## 1.2. Buscar Fornecedor por ID

* **Rota:** `GET /api/v1/fornecedores/:id`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "dados": {
    "id": 1,
    "nome": "Caloi Distribuidora S/A",
    "cnpj": "11222333000181",
    "contato": "vendas@caloi.com",
    "ativo": true
  }
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Fornecedor não encontrado"
}
```

## 1.3. Cadastrar Fornecedor

* **Rota:** `POST /api/v1/fornecedores`
* **Acesso:** Autenticado
* **Permissões:** `ANALISTA`, `GERENTE`

### Body da Requisição

```json
{
  "nome": "Shimano Brasil",
  "cnpj": "11.222.333/0001-81",
  "contato": "(11) 99999-8888"
}
```

### Resposta — 201 Created

```json
{
  "status": "sucesso",
  "mensagem": "Fornecedor cadastrado com sucesso",
  "dados": {
    "id": 2,
    "nome": "Shimano Brasil",
    "cnpj": "11222333000181",
    "contato": "(11) 99999-8888",
    "ativo": true
  }
}
```

### Resposta — 400 Bad Request

```json
{
  "status": "erro",
  "mensagem": "Nome do fornecedor é obrigatório"
}
```

O CNPJ é opcional. Quando informado, deve ter 14 caracteres alfanuméricos (os dois dígitos verificadores finais devem ser numéricos), com ou sem a máscara `XX.XXX.XXX/XXXX-XX`, e passar na validação dos dígitos verificadores. CNPJs são armazenados em formato canônico, sem máscara e em maiúsculas. CNPJ inválido retorna `400 Bad Request`; CNPJ já cadastrado retorna `409 Conflict`.

## 1.4. Atualizar Fornecedor

* **Rota:** `PUT /api/v1/fornecedores/:id`
* **Acesso:** Autenticado
* **Permissões:** `ANALISTA`, `GERENTE`
* **Body:** `nome` obrigatório; `cnpj` e `contato` opcionais.

Atualizar um fornecedor inexistente retorna `404 Not Found`. As mesmas regras de validação e unicidade do CNPJ do cadastro se aplicam.

## 1.5. Inativar Fornecedor

* **Rota:** `DELETE /api/v1/fornecedores/:id`
* **Acesso:** Autenticado
* **Permissões:** `ANALISTA`, `GERENTE`
* **Comportamento:** Inativação lógica; fornecedores inativos deixam de aparecer na listagem padrão e continuam consultáveis com `incluirInativos=true`.

Não é possível inativar um fornecedor vinculado a produto ativo. Nesse caso, a API retorna `409 Conflict`. Fornecedor inexistente retorna `404 Not Found`.

---

# 🚲 2. Endpoints de Produtos (`/api/v1/produtos`)

## 2.1. Listar Produtos

* **Rota:** `GET /api/v1/produtos`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`

### Query Parameters

* `incluirInativos` (boolean, opcional): Se `true`, retorna também produtos inativos.

**Exemplo:**

```http
GET /api/v1/produtos?incluirInativos=true
```

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 1,
      "nome": "Bicicleta Mountain Bike Aro 29",
      "codigo_interno": "MTB-29-001",
      "categoria": "Bicicletas",
      "unidade_medida": "UN",
      "localizacao_deposito": "Corredor A - Prateleira 2",
      "fornecedor_id": 1,
      "custo": 1200.50,
      "dimensoes": "180x60x100 cm",
      "estoque_atual": 0,
      "estoque_minimo": 5,
      "estado_montagem": "Desmontado",
      "imagem_url": "/uploads/imagem-123.jpg",
      "ativo": true
    }
  ]
}
```

## 2.2. Buscar Produto por ID

* **Rota:** `GET /api/v1/produtos/:id`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "dados": {
    "id": 1,
    "nome": "Bicicleta Mountain Bike Aro 29",
    "codigo_interno": "MTB-29-001",
    "categoria": "Bicicletas",
    "unidade_medida": "UN",
    "localizacao_deposito": "Corredor A - Prateleira 2",
    "fornecedor_id": 1,
    "custo": 1200.50,
    "dimensoes": "180x60x100 cm",
    "estoque_atual": 0,
    "estoque_minimo": 5,
    "estado_montagem": "Desmontado",
    "imagem_url": null,
    "ativo": true
  }
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Produto não encontrado"
}
```

## 2.3. Cadastrar Produto

* **Rota:** `POST /api/v1/produtos`
* **Acesso:** Autenticado
* **Permissões:** `ANALISTA`, `GERENTE`

### Regras de Negócio

* O produto sempre inicia com `estoque_atual = 0`.
* O estoque é alterado via movimentações.
* Se `fornecedor_id` for informado, o sistema valida se ele existe no banco.
* Se `estoque_minimo` não for fornecido, assume o valor padrão de `5`. Os alertas e o resumo usam o limite configurado em cada produto.

### Body da Requisição

```json
{
  "nome": "Capacete Ciclismo MTB",
  "codigo_interno": "ACC-CAP-002",
  "categoria": "Acessórios",
  "unidade_medida": "UN",
  "localizacao_deposito": "Setor B - Gaveta 4",
  "fornecedor_id": 1,
  "custo": 85.00,
  "dimensoes": "30x20x15 cm",
  "estoque_minimo": 10,
  "estado_montagem": "Montado"
}
```

### Resposta — 201 Created

```json
{
  "status": "sucesso",
  "mensagem": "Produto cadastrado com sucesso",
  "dados": {
    "id": 2,
    "nome": "Capacete Ciclismo MTB",
    "codigo_interno": "ACC-CAP-002",
    "categoria": "Acessórios",
    "unidade_medida": "UN",
    "localizacao_deposito": "Setor B - Gaveta 4",
    "fornecedor_id": 1,
    "custo": 85.00,
    "dimensoes": "30x20x15 cm",
    "estoque_minimo": 10,
    "estado_montagem": "Montado",
    "estoque_atual": 0,
    "ativo": true
  }
}
```

### Resposta — 400 Bad Request — Fornecedor inexistente

```json
{
  "status": "erro",
  "mensagem": "Fornecedor informado não existe."
}
```

## 2.4. Atualizar Produto

* **Rota:** `PUT /api/v1/produtos/:id`
* **Acesso:** Autenticado
* **Permissões:** `ANALISTA`, `GERENTE`

### Campos Editáveis

* `nome`
* `categoria`
* `localizacao_deposito`
* `custo`
* `estoque_minimo`
* `estado_montagem`
* `fornecedor_id`

### Body da Requisição

```json
{
  "localizacao_deposito": "Corredor C - Prateleira 1",
  "custo": 90.00
}
```

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "mensagem": "Produto atualizado com sucesso",
  "dados": {
    "id": 2,
    "nome": "Capacete Ciclismo MTB",
    "localizacao_deposito": "Corredor C - Prateleira 1",
    "custo": 90.00,
    "ativo": true
  }
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Produto não encontrado"
}
```

## 2.5. Inativar Produto (Soft Delete)

* **Rota:** `DELETE /api/v1/produtos/:id`
* **Acesso:** Autenticado
* **Permissões:** `ANALISTA`, `GERENTE`

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "mensagem": "Produto inativado com sucesso",
  "dados": {
    "id": 2,
    "ativo": false
  }
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Produto não encontrado"
}
```

## 2.6. Upload de Imagem e Vinculação Direta ao Produto

* **Rota:** `POST /api/v1/produtos/:id/imagem`
* **Acesso:** Autenticado
* **Permissões:** `ANALISTA`, `GERENTE`
* **Content-Type:** `multipart/form-data`
* **Campo de arquivo:** `imagem`

### Validações

* Tamanho máximo: `5MB`.
* Formatos aceitos: `PNG`, `JPG` ou `JPEG`.
* A validação é realizada por buffer de arquivo.
* O arquivo é salvo no servidor.
* O campo `imagem_url` do produto é atualizado automaticamente.

### Resposta — 201 Created

```json
{
  "status": "sucesso",
  "mensagem": "Imagem do produto enviada com sucesso",
  "dados": {
    "produto_id": 1,
    "nomeArquivo": "imagem-1715000000.png",
    "caminho": "/uploads/imagem-1715000000.png"
  }
}
```

### Resposta — 400 Bad Request — Arquivo grande

```json
{
  "status": "erro",
  "mensagem": "Arquivo muito grande. O tamanho máximo permitido é 5MB."
}
```

### Resposta — 400 Bad Request — Formato inválido

```json
{
  "status": "erro",
  "mensagem": "Arquivo inválido: apenas imagens PNG e JPG/JPEG válidas."
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Produto não encontrado"
}
```

---

# 📁 3. Endpoints de Upload Genérico (`/api/v1/uploads`)

## 3.1. Upload de Imagem Genérica

* **Rota:** `POST /api/v1/uploads/imagens`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`
* **Content-Type:** `multipart/form-data`
* **Campo de arquivo:** `imagem`

### Descrição

Realiza o upload do arquivo sem vinculá-lo automaticamente a um produto específico no banco. Útil para pré-visualização no front-end antes do envio dos formulários.

### Resposta — 201 Created

```json
{
  "status": "sucesso",
  "mensagem": "Imagem enviada com sucesso",
  "dados": {
    "nomeArquivo": "upload-987654321.jpg",
    "caminho": "/uploads/upload-987654321.jpg"
  }
}
```

---

# 📊 Módulo 4: Controle de Estoque, Movimentações, Alertas e Auditoria

Este módulo gerencia todas as entradas e saídas de material, validações de rastreabilidade por categoria de produto, alertas automáticos de estoque crítico e ajustes manuais com log de auditoria.

## 🛡️ Controle de Permissões (RBAC)

* **`OPERACIONAL`**, **`ANALISTA`** e **`GERENTE`**:

  * Podem listar movimentações.
  * Podem listar alertas.
  * Podem registrar entradas.
  * Podem registrar saídas.
* **`GERENTE`**:

  * Exclusividade para realizar **Ajuste Manual de Estoque (Inventário/Auditoria)**.

---

# 📋 1. Consulta de Movimentações (`/api/v1/estoque/movimentacoes`)

## 1.1. Listar Histórico de Movimentações

* **Rota:** `GET /api/v1/estoque/movimentacoes`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`

### Query Parameters

* `produto_id` (número, opcional): Filtra as movimentações por um produto específico.

**Exemplo:**

```http
GET /api/v1/estoque/movimentacoes?produto_id=1
```

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 10,
      "produto_id": 1,
      "usuario_id": 2,
      "tipo": "SAIDA",
      "quantidade": 3,
      "data_movimentacao": "2026-08-14T12:00:00.000Z",
      "numero_nota_fiscal": null,
      "numero_pedido": null,
      "destinatario": "Oficina Central",
      "motivo": "Manutenção preventiva",
      "fornecedor_id": null,
      "tipo_transporte": null
    },
    {
      "id": 9,
      "produto_id": 1,
      "usuario_id": 1,
      "tipo": "ENTRADA",
      "quantidade": 10,
      "data_movimentacao": "2026-08-10T09:30:00.000Z",
      "numero_nota_fiscal": "NF-123456",
      "numero_pedido": null,
      "destinatario": null,
      "motivo": null,
      "fornecedor_id": 1,
      "tipo_transporte": null
    }
  ]
}
```

### Resposta — 400 Bad Request — ID inválido

```json
{
  "status": "erro",
  "mensagem": "produto_id deve ser um número válido."
}
```

---

# 🚨 2. Alertas de Estoque (`/api/v1/estoque/alertas`)

## 2.1. Listar Alertas de Estoque Baixo

* **Rota:** `GET /api/v1/estoque/alertas`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`

### Regra

Alertas são gerados automaticamente quando o estoque total fica menor ou igual ao `estoque_minimo` configurado para o produto. A verificação é feita após entradas, saídas, ajustes manuais, devoluções e estornos. Há no máximo um alerta aberto por produto; ao voltar acima do mínimo, ele é marcado como lido. A criação de um novo alerta também gera notificações para `COMPRAS` e `LOGISTICA`.

## 2.2. Listar e marcar notificações

* **Listar:** `GET /api/v1/estoque/notificacoes` (opcionalmente filtrado por `?setor=COMPRAS`).
* **Marcar como lida:** `PATCH /api/v1/estoque/notificacoes/:id/lida`.
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`.

A rota de atualização retorna `404 Not Found` quando a notificação não existe.

### Resposta — 200 OK

```json
{
  "status": "sucesso",
  "dados": [
    {
      "id": 1,
      "produto_id": 1,
      "mensagem": "Estoque baixo para Bicicleta Mountain Bike Aro 29"
    }
  ]
}
```

---

# 📥 3. Entrada de Material (`/api/v1/estoque/entradas`)

## 3.1. Registrar Entrada

* **Rota:** `POST /api/v1/estoque/entradas`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`

### Regras de Negócio & Rastreabilidade

* Soma a quantidade fornecida ao `estoque_atual` do produto.
* A quantidade deve ser um número inteiro **maior que zero**.

### Categorias Especiais

#### `COMPONENTE_ELETRICO`

Exemplo: baterias.

Requer o envio de:

* `numero_serie`
* `data_validade`

Esses dados podem ser enviados diretamente no body ou na lista `itens_rastreaveis`.

#### `PECA_ESTRUTURAL`

Exemplo: motores/controladores.

Requer o envio de:

* `numero_serie`
* `lote`

### Body da Requisição

```json
{
  "produto_id": 1,
  "quantidade": 10,
  "fornecedor_id": 1,
  "numero_nota_fiscal": "NF-998877",
  "itens_rastreaveis": [
    {
      "numero_serie": "BAT-2026-001",
      "data_validade": "2028-12-31"
    }
  ]
}
```

### Resposta — 201 Created

```json
{
  "status": "sucesso",
  "mensagem": "Entrada de estoque e itens rastreáveis registrados com sucesso.",
  "dados": {
    "movimentacao_id": 15,
    "produto_id": 1,
    "quantidade_adicionada": 10,
    "novo_estoque_total": 15,
    "itens_rastreaveis_registrados": 1,
    "tempo_resposta_ms": 142
  }
}
```

### Resposta — 400 Bad Request — Quantidade inválida

```json
{
  "status": "erro",
  "mensagem": "quantidade deve ser um número inteiro maior que zero."
}
```

### Resposta — 400 Bad Request — Rastreabilidade inválida

```json
{
  "status": "erro",
  "mensagem": "Para baterias, é obrigatório informar numero_serie e data_validade."
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Produto não encontrado"
}
```

---

# 📤 4. Saída de Material (`/api/v1/estoque/saidas`)

## 4.1. Registrar Saída

* **Rota:** `POST /api/v1/estoque/saidas`
* **Acesso:** Autenticado
* **Permissões:** `OPERACIONAL`, `ANALISTA`, `GERENTE`

### Regras de Negócio

* Subtrai a quantidade do `estoque_atual`.
* Não permite saídas com quantidade maior do que o estoque físico disponível no momento.
* Em caso de saldo insuficiente, retorna `Estoque insuficiente`.
* Se o novo saldo ficar menor ou igual ao `estoque_minimo` do produto, `alerta_gerado` retornará `true`.
* `alerta_gerado` indica que o saldo está em nível de alerta; alertas abertos e notificações não são duplicados a cada movimentação.

### Body da Requisição

```json
{
  "produto_id": 1,
  "quantidade": 2,
  "destinatario": "Cliente - Pedido #1042",
  "motivo": "Venda direta"
}
```

### Resposta — 201 Created

```json
{
  "status": "sucesso",
  "mensagem": "Saída de estoque registrada com sucesso.",
  "dados": {
    "movimentacao_id": 16,
    "produto_id": 1,
    "novo_estoque_total": 3,
    "alerta_gerado": true
  }
}
```

### Resposta — 400 Bad Request — Quantidade insuficiente

```json
{
  "status": "erro",
  "mensagem": "Estoque insuficiente para a quantidade solicitada."
}
```

### Resposta — 404 Not Found

```json
{
  "status": "erro",
  "mensagem": "Produto não encontrado"
}
```

---

# 🛠️ 5. Ajuste Manual & Auditoria (`/api/v1/estoque/ajuste-manual`)

## 5.1. Registrar Ajuste Manual (Contagem de Inventário)

* **Rota:** `POST /api/v1/estoque/ajuste-manual`
* **Acesso:** Autenticado
* **Permissão exclusiva:** `GERENTE`

### Regras de Negócio

* Sobrescreve o valor de `estoque_atual` para o valor exato informado em `nova_quantidade`.
* Registra obrigatoriamente um log na tabela `auditoria`.
* Registra também uma movimentação do tipo `AJUSTE_MANUAL` no histórico de estoque.
* O log contém:

  * justificativa;
  * valor antigo;
  * novo valor.

### Body da Requisição

```json
{
  "produto_id": 1,
  "nova_quantidade": 20,
  "justificativa": "Ajuste após contagem de inventário físico trimestral"
}
```

### Resposta — 201 Created

```json
{
  "status": "sucesso",
  "mensagem": "Ajuste manual realizado com sucesso.",
  "dados": {
    "produto_id": 1,
    "estoque_anterior": 3,
    "estoque_atual": 20,
    "log_auditoria_registrado": true
  }
}
```

### Resposta — 400 Bad Request

```json
{
  "status": "erro",
  "mensagem": "nova_quantidade deve ser um número inteiro maior que zero."
}
```

### Resposta — 403 Forbidden — Perfil não autorizado

```json
{
  "status": "erro",
  "mensagem": "Permissão insuficiente"
}
```

---

## 📌 Resumo dos Prefixos de API

| Módulo       | Prefixo                |
| ------------ | ---------------------- |
| Autenticação | `/api/v1/auth`         |
| Usuários     | `/api/v1/usuarios`     |
| Produtos     | `/api/v1/produtos`     |
| Fornecedores | `/api/v1/fornecedores` |
| Estoque      | `/api/v1/estoque`      |
| Uploads      | `/api/v1/uploads`      |

## 🔐 Resumo dos Perfis

| Perfil        | Usuários               | Produtos                  | Fornecedores | Estoque               | Ajuste Manual |
| ------------- | ---------------------- | ------------------------- | ------------ | --------------------- | ------------- |
| `OPERACIONAL` | Próprias configurações | Leitura + upload genérico | Leitura      | Operações e consultas | ❌             |
| `ANALISTA`    | Próprias configurações | CRUD + imagens            | CRUD         | Operações e consultas | ❌             |
| `GERENTE`     | Gestão completa        | CRUD + imagens            | CRUD         | Operações e consultas | ✅             |

## ⏱️ Regras de Segurança

* Token JWT expira em **30 minutos**.
* Rotas protegidas exigem `Authorization: Bearer <token>`.
* Após **3 tentativas de login malsucedidas**, a conta é bloqueada por **15 minutos**.
* Operações de gestão de usuários são exclusivas do perfil `GERENTE`.
* Ajustes manuais de estoque são exclusivos do perfil `GERENTE`.
## Devoluções de estoque

Na rota `POST /api/v1/estoque/devolucoes`, `origem` deve ser `CLIENTE` ou
`PARA_FORNECEDOR`, e `estado_produto` deve ser `INTACTO` ou `DANIFICADO`.

- `CLIENTE` + `INTACTO` retorna a quantidade ao estoque.
- `PARA_FORNECEDOR` reduz a quantidade do estoque.
- Produto `DANIFICADO` não retorna ao estoque. Quando for rastreável, seus itens
  ficam com status `AVARIA`.
- Para produtos rastreáveis, envie `rastreabilidade_ids` com exatamente os itens
  devolvidos. Itens intactos de cliente ficam `EM_ESTOQUE`; itens enviados ao
  fornecedor ficam `SAIDA`.
