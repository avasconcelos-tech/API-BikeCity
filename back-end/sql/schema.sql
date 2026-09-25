CREATE TABLE IF NOT EXISTS schema_versao (
  versao INT NOT NULL PRIMARY KEY,
  nome VARCHAR(190) NOT NULL,
  aplicado_em DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(190) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  cargo VARCHAR(190) NULL,
  perfil VARCHAR(40) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  tentativas_falhas INT NOT NULL DEFAULT 0,
  bloqueado_until DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fornecedores (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(190) NOT NULL,
  cnpj VARCHAR(32) NULL,
  contato VARCHAR(255) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY idx_fornecedores_cnpj (cnpj)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS produtos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  codigo_interno VARCHAR(100) NULL UNIQUE,
  categoria VARCHAR(80) NULL,
  unidade_medida VARCHAR(40) NULL,
  localizacao_deposito VARCHAR(255) NULL,
  fornecedor_id INT NULL,
  custo DECIMAL(12,2) NOT NULL DEFAULT 0,
  dimensoes VARCHAR(255) NULL,
  estoque_atual INT NOT NULL DEFAULT 0,
  estoque_minimo INT NOT NULL DEFAULT 0,
  estado_montagem VARCHAR(40) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  imagem_url VARCHAR(500) NULL,
  tipo_rastreabilidade VARCHAR(40) NOT NULL DEFAULT 'NENHUMA',
  demanda_prevista INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_produtos_fornecedor FOREIGN KEY (fornecedor_id)
    REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimentacoes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  usuario_id INT NULL,
  tipo VARCHAR(40) NOT NULL,
  quantidade INT NOT NULL,
  data_movimentacao DATETIME(3) NOT NULL,
  numero_nota_fiscal VARCHAR(100) NULL,
  numero_pedido VARCHAR(100) NULL,
  numero_pedido_venda VARCHAR(100) NULL,
  destinatario VARCHAR(255) NULL,
  motivo TEXT NULL,
  fornecedor_id INT NULL,
  tipo_transporte VARCHAR(100) NULL,
  montado_desmontado VARCHAR(40) NULL,
  localizacao VARCHAR(255) NULL,
  observacao TEXT NULL,
  estoque_anterior INT NULL,
  estoque_novo INT NULL,
  movimentacao_origem_id INT NULL,
  CONSTRAINT fk_movimentacoes_produto FOREIGN KEY (produto_id)
    REFERENCES produtos(id),
  CONSTRAINT fk_movimentacoes_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_movimentacoes_fornecedor FOREIGN KEY (fornecedor_id)
    REFERENCES fornecedores(id) ON DELETE SET NULL,
  CONSTRAINT fk_movimentacoes_origem FOREIGN KEY (movimentacao_origem_id)
    REFERENCES movimentacoes(id) ON DELETE SET NULL,
  KEY idx_movimentacoes_data_id (data_movimentacao, id),
  KEY idx_movimentacoes_produto (produto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rastreabilidade (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  movimentacao_id INT NULL,
  tipo VARCHAR(40) NOT NULL,
  numero_serie VARCHAR(255) NULL,
  lote VARCHAR(255) NULL,
  data_validade VARCHAR(40) NULL,
  identificador_unico VARCHAR(255) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'EM_ESTOQUE',
  localizacao VARCHAR(255) NULL,
  numero_serie_unico VARCHAR(255) GENERATED ALWAYS AS (NULLIF(TRIM(numero_serie), '')) STORED,
  identificador_unico_unico VARCHAR(255) GENERATED ALWAYS AS (NULLIF(TRIM(identificador_unico), '')) STORED,
  CONSTRAINT fk_rastreabilidade_produto FOREIGN KEY (produto_id)
    REFERENCES produtos(id),
  CONSTRAINT fk_rastreabilidade_movimentacao FOREIGN KEY (movimentacao_id)
    REFERENCES movimentacoes(id) ON DELETE SET NULL,
  UNIQUE KEY idx_rastreabilidade_numero_serie (numero_serie_unico),
  UNIQUE KEY idx_rastreabilidade_identificador_unico (identificador_unico_unico),
  KEY idx_rastreabilidade_produto_status (produto_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alertas (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  mensagem TEXT NOT NULL,
  lido TINYINT(1) NOT NULL DEFAULT 0,
  criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  produto_aberto_id INT GENERATED ALWAYS AS (IF(lido = 0, produto_id, NULL)) STORED,
  CONSTRAINT fk_alertas_produto FOREIGN KEY (produto_id)
    REFERENCES produtos(id),
  UNIQUE KEY idx_alertas_produto_aberto (produto_aberto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auditoria (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NULL,
  usuario_id INT NULL,
  acao VARCHAR(80) NULL,
  antigo_valor TEXT NULL,
  novo_valor TEXT NULL,
  justificativa TEXT NULL,
  data DATETIME(3) NOT NULL,
  CONSTRAINT fk_auditoria_produto FOREIGN KEY (produto_id)
    REFERENCES produtos(id) ON DELETE SET NULL,
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS devolucoes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  usuario_id INT NULL,
  origem VARCHAR(40) NOT NULL,
  motivo TEXT NOT NULL,
  estado_produto VARCHAR(40) NOT NULL,
  numero_pedido_venda VARCHAR(100) NULL,
  reaproveitavel TINYINT(1) NOT NULL DEFAULT 0,
  quantidade INT NOT NULL,
  data_devolucao DATETIME(3) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'APROVADA',
  observacao TEXT NULL,
  CONSTRAINT fk_devolucoes_produto FOREIGN KEY (produto_id)
    REFERENCES produtos(id),
  CONSTRAINT fk_devolucoes_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificacoes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  setor VARCHAR(80) NOT NULL,
  titulo VARCHAR(190) NOT NULL,
  mensagem TEXT NOT NULL,
  produto_id INT NULL,
  lida TINYINT(1) NOT NULL DEFAULT 0,
  criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_notificacoes_produto FOREIGN KEY (produto_id)
    REFERENCES produtos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schema_versao (versao, nome, aplicado_em)
VALUES (1, '001_bikecity_mysql_baseline', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE versao = VALUES(versao);
