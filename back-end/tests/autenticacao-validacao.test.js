process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-only';

const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const servicoAutenticacao = require('../src/servicos/servicoAutenticacao');
const servicoUsuario = require('../src/servicos/servicoUsuario');
const ErroNegocio = require('../src/erros/ErroNegocio');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());
test.after(() => conexaoBanco.fecharBanco());

test('login rejects missing credentials or non-text passwords', async () => {
  await assert.rejects(servicoAutenticacao.realizarLogin('gerente@teste.com', undefined), ErroNegocio);
  await assert.rejects(servicoAutenticacao.realizarLogin('gerente@teste.com', 123), ErroNegocio);
});

test('login normalizes email case and whitespace', async () => {
  const resultado = await servicoAutenticacao.realizarLogin('  GERENTE@TESTE.COM  ', 'senha123');
  assert.ok(resultado.token);
});

test('password change rejects non-text current passwords', async () => {
  await assert.rejects(servicoUsuario.trocarSenha(1, undefined, 'nova123'), ErroNegocio);
  await assert.rejects(servicoUsuario.trocarSenha(1, 123, 'nova123'), ErroNegocio);
});

test('user creation and updates normalize email', async () => {
  const cadastro = await servicoUsuario.criarUsuario({
    nome: 'Usuário Normalizado',
    email: '  NOVO@EXEMPLO.COM ',
    cargo: 'Analista',
    perfil: 'ANALISTA',
    senha: 'senha123',
  });
  assert.equal((await servicoUsuario.buscarUsuarioPorId(cadastro.id)).email, 'novo@exemplo.com');

  const atualizado = await servicoUsuario.atualizarUsuario(cadastro.id, {
    email: '  EDITADO@EXEMPLO.COM ',
  });
  assert.equal(atualizado.email, 'editado@exemplo.com');
});

test('user creation validates name, email, password, and profile while allowing descriptive roles', async () => {
  await assert.rejects(
    servicoUsuario.criarUsuario({
      email: 'novo@exemplo.com',
      perfil: 'OPERACIONAL',
      senha: 'senha123',
    }),
    ErroNegocio,
  );
  await assert.rejects(
    servicoUsuario.criarUsuario({
      nome: 'Usuário',
      email: 'novo@exemplo.com',
      cargo: 'Administrador de depósito',
      perfil: 'ADMIN',
      senha: 'senha123',
    }),
    ErroNegocio,
  );
  const cadastro = await servicoUsuario.criarUsuario({
    nome: ' Usuário ',
    email: ' NOVO@EXEMPLO.COM ',
    cargo: 'Administradora de depósito',
    perfil: 'ANALISTA',
    senha: 'senha123',
  });
  const cadastrado = await servicoUsuario.buscarUsuarioPorId(cadastro.id);
  assert.equal(cadastrado.nome, 'Usuário');
  assert.equal(cadastrado.cargo, 'Administradora de depósito');
  assert.equal(cadastrado.perfil, 'ANALISTA');
});

test('user updates validate partial fields and reject duplicate email', async () => {
  const cadastro = await servicoUsuario.criarUsuario({
    nome: 'Usuário',
    email: 'usuario@exemplo.com',
    perfil: 'OPERACIONAL',
    senha: 'senha123',
  });
  await assert.rejects(
    servicoUsuario.atualizarUsuario(cadastro.id, { email: ' GERENTE@TESTE.COM ' }),
    ErroNegocio,
  );
  await assert.rejects(servicoUsuario.atualizarUsuario(cadastro.id, { perfil: 'ADMIN' }), ErroNegocio);
  await assert.rejects(servicoUsuario.atualizarUsuario(cadastro.id, {}), ErroNegocio);
});

test('protects against self deactivation and removal of the last active manager', async () => {
  await assert.rejects(servicoUsuario.desativarUsuario(1, 1), ErroNegocio);
  await assert.rejects(servicoUsuario.atualizarUsuario(1, { perfil: 'ANALISTA' }), ErroNegocio);
  await assert.rejects(servicoUsuario.desativarUsuario(1, 999), ErroNegocio);
  assert.equal((await servicoUsuario.buscarUsuarioPorId(1)).ativo, true);
});

test('manager can reset another user password without their current password', async () => {
  const cadastro = await servicoUsuario.criarUsuario({
    nome: 'Usuário',
    email: 'usuario@exemplo.com',
    perfil: 'OPERACIONAL',
    senha: 'senha123',
  });
  const resultado = await servicoUsuario.redefinirSenha(cadastro.id, 'novaSenha123', 1);
  const login = await servicoAutenticacao.realizarLogin('usuario@exemplo.com', 'novaSenha123');
  assert.equal(resultado.senha_alterada, true);
  assert.ok(login.token);
});
