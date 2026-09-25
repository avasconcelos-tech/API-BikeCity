INSERT INTO usuarios (id,nome,email,senha_hash,cargo,perfil,ativo,tentativas_falhas,bloqueado_until)
VALUES (1,'Gerente Teste','gerente@teste.com','$2a$10$8pFyKKdH91T3HNc8iC0aDuYH20LxPqAlxl9k9wBDhU69EZk1O5EXi','Gerente','GERENTE',1,0,NULL)
ON DUPLICATE KEY UPDATE id = VALUES(id);

INSERT INTO fornecedores (id,nome,cnpj,contato,ativo)
VALUES (1,'Fornecedor Padrão',NULL,'Contato padrão',1)
ON DUPLICATE KEY UPDATE id = VALUES(id);

INSERT INTO produtos (id,nome,codigo_interno,categoria,unidade_medida,localizacao_deposito,fornecedor_id,custo,estoque_atual,estoque_minimo,estado_montagem,ativo)
VALUES
  (1,'Bateria X','BAT-001','COMPONENTE_ELETRICO','UN','Setor B',1,100,0,3,'NAO_APLICA',1),
  (2,'Peça A','PEC-001','PECA_ESTRUTURAL','UN','Setor A',1,50,4,3,'NAO_APLICA',1),
  (3,'Bicicleta City','BIKE-001','VEICULO','UN','Setor C',1,1500,2,1,'MONTADO',1),
  (4,'Pneu de Segurança','PNEU-001','PECA_SEGURANCA','UN','Setor D',1,80,6,2,'NAO_APLICA',1)
ON DUPLICATE KEY UPDATE id = VALUES(id);
