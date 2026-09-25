const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app, resetarEstado } = require('../src/server');

test.beforeEach(() => resetarEstado());

async function obterToken(email = 'gerente@teste.com', senha = 'senha123') {
  const resposta = await request(app).post('/api/v1/auth/login').send({ email, senha });
  assert.equal(resposta.status, 200);
  return resposta.body.dados.token;
}

test('criação valida campos, limita perfil e edição de e-mail duplicado responde 409', async () => {
  const token = await obterToken();
  const invalido = await request(app)
    .post('/api/v1/usuarios')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: '', email: 'invalido', perfil: 'ADMIN', senha: '123' });
  assert.equal(invalido.status, 400);

  const criado = await request(app)
    .post('/api/v1/usuarios')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nome: 'Usuária',
      email: 'usuaria@teste.com',
      cargo: 'Especialista em baterias',
      perfil: 'ANALISTA',
      senha: 'senha123'
    });
  assert.equal(criado.status, 201);

  const duplicado = await request(app)
    .put(`/api/v1/usuarios/${criado.body.dados.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ email: ' GERENTE@TESTE.COM ' });
  assert.equal(duplicado.status, 409);
});

test('impede desativação própria e remoção do perfil do último gerente ativo', async () => {
  const token = await obterToken();

  const desativarPropriaConta = await request(app)
    .delete('/api/v1/usuarios/1')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(desativarPropriaConta.status, 400);

  const removerUltimoGerente = await request(app)
    .put('/api/v1/usuarios/1')
    .set('Authorization', `Bearer ${token}`)
    .send({ perfil: 'ANALISTA' });
  assert.equal(removerUltimoGerente.status, 409);
});

test('gerente pode reativar usuário e redefinir sua senha; outros perfis não podem', async () => {
  const gerenteToken = await obterToken();
  const criado = await request(app)
    .post('/api/v1/usuarios')
    .set('Authorization', `Bearer ${gerenteToken}`)
    .send({
      nome: 'Usuário',
      email: 'usuario@teste.com',
      cargo: 'Operação',
      perfil: 'OPERACIONAL',
      senha: 'senha123'
    });
  const id = criado.body.dados.id;

  const desativado = await request(app)
    .delete(`/api/v1/usuarios/${id}`)
    .set('Authorization', `Bearer ${gerenteToken}`);
  assert.equal(desativado.status, 200);

  const reativado = await request(app)
    .patch(`/api/v1/usuarios/${id}/reativar`)
    .set('Authorization', `Bearer ${gerenteToken}`);
  assert.equal(reativado.status, 200);
  assert.equal(reativado.body.dados.ativo, true);

  const usuarioToken = await obterToken('usuario@teste.com');
  const proibido = await request(app)
    .patch(`/api/v1/usuarios/${id}/senha`)
    .set('Authorization', `Bearer ${usuarioToken}`)
    .send({ novaSenha: 'novaSenha123' });
  assert.equal(proibido.status, 403);

  const redefinido = await request(app)
    .patch(`/api/v1/usuarios/${id}/senha`)
    .set('Authorization', `Bearer ${gerenteToken}`)
    .send({ novaSenha: 'novaSenha123' });
  assert.equal(redefinido.status, 200);

  const redefinicaoPropria = await request(app)
    .patch('/api/v1/usuarios/1/senha')
    .set('Authorization', `Bearer ${gerenteToken}`)
    .send({ novaSenha: 'outraSenha123' });
  assert.equal(redefinicaoPropria.status, 400);

  const novoLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'usuario@teste.com', senha: 'novaSenha123' });
  assert.equal(novoLogin.status, 200);
});
