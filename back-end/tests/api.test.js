const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, resetState } = require('../src/server');

test.beforeEach(() => resetState());

test('configuração usa o JWT_SECRET do ambiente', () => {
  const config = require('../src/configuracoes');

  assert.equal(config.SECRET, process.env.JWT_SECRET);
});

test('listar usuários não expõe senha_hash na resposta', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const res = await request(app)
    .get('/api/v1/usuarios')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.dados));
  assert.ok(res.body.dados.some((usuario) => usuario.email === 'gerente@teste.com'));
  assert.equal(res.body.dados[0].senha_hash, undefined);
});

test('login retorna token JWT e bloqueia após três tentativas falhas', async () => {
  const res1 = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'errada' });
  const res2 = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'errada' });
  const res3 = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'errada' });

  assert.equal(res1.status, 401);
  assert.equal(res2.status, 401);
  assert.equal(res3.status, 403);
  assert.match(res3.body.mensagem, /bloqueada/i);
});

test('usuário pode atualizar seus dados, ser desativado e trocar a própria senha', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const detalhes = await request(app)
    .get('/api/v1/usuarios/1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(detalhes.status, 200);
  assert.equal(detalhes.body.dados.email, 'gerente@teste.com');

  const atualizacao = await request(app)
    .put('/api/v1/usuarios/1')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Gerente Atualizado', cargo: 'Coordenador' });

  assert.equal(atualizacao.status, 200);
  assert.equal(atualizacao.body.dados.nome, 'Gerente Atualizado');

  const senha = await request(app)
    .patch('/api/v1/usuarios/me/senha')
    .set('Authorization', `Bearer ${token}`)
    .send({ senhaAtual: 'senha123', novaSenha: 'novaSenha123' });

  assert.equal(senha.status, 200);
  assert.equal(senha.body.dados.senha_alterada, true);

  const loginNovaSenha = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'gerente@teste.com', senha: 'novaSenha123' });

  assert.equal(loginNovaSenha.status, 200);

  const inativacao = await request(app)
    .delete('/api/v1/usuarios/1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(inativacao.status, 200);
  assert.equal(inativacao.body.dados.ativo, false);
});

test('entrada de estoque exige dados de rastreabilidade corretos para baterias', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const res = await request(app)
    .post('/api/v1/estoque/entradas')
    .set('Authorization', `Bearer ${token}`)
    .send({
      produto_id: 1,
      quantidade: 2,
      fornecedor_id: 1,
      valor_custo: 100,
      numero_nota_fiscal: 'NF-1',
      numero_pedido_compra: 'PC-1',
      itens_rastreaveis: [{ lote: 'LOT-1' }]
    });

  assert.equal(res.status, 400);
  assert.match(res.body.mensagem, /numero_serie|data_validade/i);
});

test('saída rejeita quantidade inválida', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const res = await request(app)
    .post('/api/v1/estoque/saidas')
    .set('Authorization', `Bearer ${token}`)
    .send({ produto_id: 2, quantidade: -1, destinatario: 'Setor A', motivo: 'Uso interno' });

  assert.equal(res.status, 400);
  assert.match(res.body.mensagem, /número inteiro maior que zero|quantidade/i);
});

test('saída maior que o estoque disponível retorna erro 400', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const res = await request(app)
    .post('/api/v1/estoque/saidas')
    .set('Authorization', `Bearer ${token}`)
    .send({ produto_id: 2, quantidade: 99, destinatario: 'Setor A', motivo: 'Uso interno', numero_pedido_venda: 'PV-99' });

  assert.equal(res.status, 400);
  assert.match(res.body.mensagem, /estoque insuficiente|insuficiente/i);
});

test('saída de estoque gera alerta quando estoque atinge o mínimo', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  await request(app)
    .post('/api/v1/estoque/entradas')
    .set('Authorization', `Bearer ${token}`)
    .send({
      produto_id: 2,
      quantidade: 5,
      fornecedor_id: 1,
      valor_custo: 50,
      numero_nota_fiscal: 'NF-2',
      numero_pedido_compra: 'PC-2'
    });

  const res = await request(app)
    .post('/api/v1/estoque/saidas')
    .set('Authorization', `Bearer ${token}`)
    .send({ produto_id: 2, quantidade: 6, destinatario: 'Setor A', motivo: 'Uso interno', numero_pedido_venda: 'PV-4' });

  assert.equal(res.status, 201);
  assert.equal(res.body.dados.alerta_gerado, true);
});

test('lista alertas de estoque gerados', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  await request(app)
    .post('/api/v1/estoque/saidas')
    .set('Authorization', `Bearer ${token}`)
    .send({ produto_id: 2, quantidade: 4, destinatario: 'Setor A', motivo: 'Uso interno', numero_pedido_venda: 'PV-4' });

  const res = await request(app)
    .get('/api/v1/estoque/alertas')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.dados));
  assert.ok(res.body.dados.some((alerta) => alerta.produto_id === 2 && alerta.mensagem.includes('Peça A')));
});

test('produto específico, atualização e inativação funcionam com lista filtrada', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const detalhe = await request(app)
    .get('/api/v1/produtos/2')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(detalhe.status, 200);
  assert.equal(detalhe.body.dados.nome, 'Peça A');

  const atualizacao = await request(app)
    .put('/api/v1/produtos/2')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nome: 'Peça A Editada',
      categoria: 'PECA_ESTRUTURAL',
      localizacao_deposito: 'Setor Z',
      custo: 75,
      estoque_minimo: 2,
      estado_montagem: 'NAO_APLICA'
    });

  assert.equal(atualizacao.status, 200);
  assert.equal(atualizacao.body.dados.nome, 'Peça A Editada');

  const inativacao = await request(app)
    .delete('/api/v1/produtos/2')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(inativacao.status, 200);
  assert.equal(inativacao.body.dados.ativo, false);

  const lista = await request(app)
    .get('/api/v1/produtos')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(lista.status, 200);
  assert.ok(!lista.body.dados.some((produto) => produto.id === 2));

  const listaComInativos = await request(app)
    .get('/api/v1/produtos?incluirInativos=true')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listaComInativos.status, 200);
  assert.ok(listaComInativos.body.dados.some((produto) => produto.id === 2 && produto.ativo === false));
});

test('ajuste manual rejeita nova_quantidade inválida', async () => {
  const gerenteLogin = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = gerenteLogin.body.dados.token;

  const res = await request(app)
    .post('/api/v1/estoque/ajuste-manual')
    .set('Authorization', `Bearer ${token}`)
    .send({ produto_id: 2, nova_quantidade: -1, justificativa: 'Ajuste inválido' });

  assert.equal(res.status, 400);
  assert.match(res.body.mensagem, /maior ou igual a 0|número/i);
});

test('ajuste manual exige perfil GERENTE e registra auditoria', async () => {
  const gerenteLogin = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = gerenteLogin.body.dados.token;

  const res = await request(app)
    .post('/api/v1/estoque/ajuste-manual')
    .set('Authorization', `Bearer ${token}`)
    .send({ produto_id: 2, nova_quantidade: 12, justificativa: 'Ajuste de inventário' });

  assert.equal(res.status, 201);
  assert.equal(res.body.dados.log_auditoria_registrado, true);
  assert.ok(res.body.dados.movimentacao_id);
});

test('lista movimentações do estoque com filtro por produto', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  await request(app)
    .post('/api/v1/estoque/entradas')
    .set('Authorization', `Bearer ${token}`)
    .send({
      produto_id: 2,
      quantidade: 3,
      fornecedor_id: 1,
      valor_custo: 50,
      numero_nota_fiscal: 'NF-3',
      numero_pedido_compra: 'PC-3',
      numero_serie: 'SERIE-123',
      lote: 'LOTE-ABC'
    });

  const res = await request(app)
    .get('/api/v1/estoque/movimentacoes?produto_id=2')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.dados));
  assert.ok(res.body.dados.some((mov) => mov.produto_id === 2 && mov.tipo === 'ENTRADA'));
});

test('upload rejeita arquivo maior que 5MB com mensagem clara', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const res = await request(app)
    .post('/api/v1/uploads/imagens')
    .set('Authorization', `Bearer ${token}`)
    .attach('imagem', Buffer.alloc(6 * 1024 * 1024, 'x'), { filename: 'grande.png', contentType: 'image/png' });

  assert.equal(res.status, 400);
  assert.match(res.body.mensagem, /muito grande|5MB|máximo/i);
});

test('upload rejeita arquivo com mimetype e extensão falsificados', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const res = await request(app)
    .post('/api/v1/uploads/imagens')
    .set('Authorization', `Bearer ${token}`)
    .attach('imagem', Buffer.from('conteudo-que-nao-e-imagem'), { filename: 'arquivo.png', contentType: 'image/png' });

  assert.equal(res.status, 400);
  assert.match(res.body.mensagem, /imagem|arquivo/i);
});

test('upload de imagem salva arquivo na pasta uploads', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const pngValido = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF' +
    'c0C2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkG' +
    'AAAAAAgI0v9QAAAAASUVORK5CYII=',
    'base64'
  );

  const res = await request(app)
    .post('/api/v1/uploads/imagens')
    .set('Authorization', `Bearer ${token}`)
    .attach('imagem', pngValido, { filename: 'teste.png', contentType: 'image/png' });

  assert.equal(res.status, 201);
  assert.match(res.body.dados.caminho, /\/uploads\//);
});

test('fornecedor é criado e consultado com validação de produto', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const cadastroFornecedor = await request(app)
    .post('/api/v1/fornecedores')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'ACME Ltda', cnpj: '12.345.678/0001-90', contato: 'Maria' });

  assert.equal(cadastroFornecedor.status, 201);
  assert.ok(cadastroFornecedor.body.dados.id);

  const listagem = await request(app)
    .get('/api/v1/fornecedores')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(listagem.status, 200);
  assert.ok(Array.isArray(listagem.body.dados));

  const detalhe = await request(app)
    .get(`/api/v1/fornecedores/${cadastroFornecedor.body.dados.id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(detalhe.status, 200);
  assert.equal(detalhe.body.dados.nome, 'ACME Ltda');

  const produtoInvalido = await request(app)
    .post('/api/v1/produtos')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nome: 'Produto sem fornecedor',
      codigo_interno: 'PROD-999',
      categoria: 'PECA_ESTRUTURAL',
      unidade_medida: 'UN',
      localizacao_deposito: 'Setor C',
      fornecedor_id: 999,
      custo: 45,
      dimensoes: '10x10',
      estoque_minimo: 2,
      estado_montagem: 'NAO_APLICA'
    });

  assert.equal(produtoInvalido.status, 400);
  assert.match(produtoInvalido.body.mensagem, /fornecedor/i);
});

test('upload de imagem vincula ao produto correto', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const pngValido = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF' +
    'c0C2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkG' +
    'AAAAAAgI0v9QAAAAASUVORK5CYII=',
    'base64'
  );

  const res = await request(app)
    .post('/api/v1/produtos/1/imagem')
    .set('Authorization', `Bearer ${token}`)
    .attach('imagem', pngValido, { filename: 'produto1.png', contentType: 'image/png' });

  assert.equal(res.status, 201);
  assert.match(res.body.dados.caminho, /\/uploads\//);
  assert.equal(res.body.dados.produto_id, 1);

  const produtoAtualizado = await request(app)
    .get('/api/v1/produtos/1')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(produtoAtualizado.status, 200);
  assert.equal(produtoAtualizado.body.dados.imagem_url, res.body.dados.caminho);
});

test('upload de imagem para produto inexistente retorna 404', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email: 'gerente@teste.com', senha: 'senha123' });
  const token = login.body.dados.token;

  const pngValido = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF' +
    'c0C2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJ0UkG' +
    'AAAAAAgI0v9QAAAAASUVORK5CYII=',
    'base64'
  );

  const res = await request(app)
    .post('/api/v1/produtos/999/imagem')
    .set('Authorization', `Bearer ${token}`)
    .attach('imagem', pngValido, { filename: 'produto999.png', contentType: 'image/png' });

  assert.equal(res.status, 404);
  assert.match(res.body.mensagem, /produto|não encontrado/i);
});

test('requisitos de rastreabilidade cobrem veículo e peça de segurança', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email:'gerente@teste.com', senha:'senha123' });
  const token=login.body.dados.token;
  const veiculo=await request(app).post('/api/v1/estoque/entradas').set('Authorization',`Bearer ${token}`).send({produto_id:3,quantidade:1,fornecedor_id:1,numero_nota_fiscal:'NF-V',numero_pedido_compra:'PC-V'});
  assert.equal(veiculo.status,400); assert.match(veiculo.body.mensagem,/ID único/i);
  const pneu=await request(app).post('/api/v1/estoque/entradas').set('Authorization',`Bearer ${token}`).send({produto_id:4,quantidade:1,fornecedor_id:1,numero_nota_fiscal:'NF-P',numero_pedido_compra:'PC-P'});
  assert.equal(pneu.status,400); assert.match(pneu.body.mensagem,/lote/i);
});

test('entrada registra dados fiscais e rastreabilidade no histórico', async () => {
  const login = await request(app).post('/api/v1/auth/login').send({ email:'gerente@teste.com', senha:'senha123' });
  const token=login.body.dados.token;
  const res=await request(app).post('/api/v1/estoque/entradas').set('Authorization',`Bearer ${token}`).send({produto_id:1,quantidade:1,fornecedor_id:1,numero_nota_fiscal:'NF-R',numero_pedido_compra:'PC-R',numero_serie:'BAT-R',data_validade:'2027-01-01',tipo_transporte:'Caminhão'});
  assert.equal(res.status,201);
  const rast=await request(app).get('/api/v1/estoque/rastreabilidade?produto_id=1').set('Authorization',`Bearer ${token}`);
  assert.equal(rast.status,200);assert.equal(rast.body.dados[0].numero_serie,'BAT-R');
});

test('saída exige pedido de venda e registra destinação', async () => {
  const login=await request(app).post('/api/v1/auth/login').send({email:'gerente@teste.com',senha:'senha123'});const token=login.body.dados.token;
  const bad=await request(app).post('/api/v1/estoque/saidas').set('Authorization',`Bearer ${token}`).send({produto_id:2,quantidade:1,destinatario:'Vendas',motivo:'Venda'});assert.equal(bad.status,400);
  const ok=await request(app).post('/api/v1/estoque/saidas').set('Authorization',`Bearer ${token}`).send({produto_id:2,quantidade:1,destinatario:'Cliente A',motivo:'Venda',numero_pedido_venda:'PV-1'});assert.equal(ok.status,201);
});

test('devolução de cliente reaproveitável retorna estoque', async () => {
  const login=await request(app).post('/api/v1/auth/login').send({email:'gerente@teste.com',senha:'senha123'});const token=login.body.dados.token;
  const antes=(await request(app).get('/api/v1/produtos/2').set('Authorization',`Bearer ${token}`)).body.dados.estoque_atual;
  const r=await request(app).post('/api/v1/estoque/devolucoes').set('Authorization',`Bearer ${token}`).send({produto_id:2,quantidade:1,origem:'CLIENTE',motivo:'Troca',estado_produto:'INTACTO',numero_pedido_venda:'PV-D',reaproveitavel:true});
  assert.equal(r.status,201);const depois=(await request(app).get('/api/v1/produtos/2').set('Authorization',`Bearer ${token}`)).body.dados.estoque_atual;assert.equal(depois,antes+1);
});

test('dashboard e relatório consolidam estoque', async()=>{const login=await request(app).post('/api/v1/auth/login').send({email:'gerente@teste.com',senha:'senha123'});const token=login.body.dados.token;const d=await request(app).get('/api/v1/dashboard/resumo').set('Authorization',`Bearer ${token}`);const r=await request(app).get('/api/v1/estoque/relatorios').set('Authorization',`Bearer ${token}`);assert.equal(d.status,200);assert.equal(r.status,200);assert.ok(Array.isArray(r.body.dados.estoque));});
