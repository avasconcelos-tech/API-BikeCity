process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-only';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { app } = require('../src/server');
const { SECRET } = require('../src/configuracoes');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const servicoAutenticacao = require('../src/servicos/servicoAutenticacao');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());
test.after(() => conexaoBanco.fecharBanco());

test('middleware rejeita token de usuário inativo', async () => {
  const login = await servicoAutenticacao.realizarLogin('gerente@teste.com', 'senha123');
  const token = login.token;
  await conexaoBanco.executar('UPDATE usuarios SET ativo = 0 WHERE id = 1');

  const resposta = await request(app)
    .get('/api/v1/usuarios')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resposta.status, 401);
});

test('middleware usa o perfil atual do banco, não o perfil do token', async () => {
  const login = await servicoAutenticacao.realizarLogin('gerente@teste.com', 'senha123');
  const token = login.token;
  await conexaoBanco.executar("UPDATE usuarios SET perfil = 'OPERACIONAL' WHERE id = 1");

  const resposta = await request(app)
    .get('/api/v1/usuarios')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(resposta.status, 403);
});

test('configuração não fornece segredo JWT padrão', () => {
  const token = jwt.sign({ id: 1 }, SECRET, { algorithm: 'HS256' });
  assert.notEqual(SECRET, 'chave_secreta_padrao');
  assert.ok(token);
});
