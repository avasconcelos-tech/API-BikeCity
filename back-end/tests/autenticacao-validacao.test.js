const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const servicoAutenticacao = require('../src/servicos/servicoAutenticacao');
const servicoUsuario = require('../src/servicos/servicoUsuario');
const ErroNegocio = require('../src/erros/ErroNegocio');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());

test('login rejeita credenciais ausentes ou com senha não textual', () => {
  assert.throws(() => servicoAutenticacao.realizarLogin('gerente@teste.com', undefined), ErroNegocio);
  assert.throws(() => servicoAutenticacao.realizarLogin('gerente@teste.com', 123), ErroNegocio);
});

test('login normaliza e-mail sem diferenciar maiúsculas e minúsculas', () => {
  const resultado = servicoAutenticacao.realizarLogin('  GERENTE@TESTE.COM  ', 'senha123');
  assert.ok(resultado.token);
});

test('troca de senha rejeita valores que não sejam textos', () => {
  assert.throws(() => servicoUsuario.trocarSenha(1, undefined, 'nova123'), ErroNegocio);
  assert.throws(() => servicoUsuario.trocarSenha(1, 123, 'nova123'), ErroNegocio);
});

test('cadastro e edição normalizam o e-mail', () => {
  const cadastro = servicoUsuario.criarUsuario({
    nome: 'Usuário Normalizado',
    email: '  NOVO@EXEMPLO.COM ',
    cargo: 'Analista',
    perfil: 'ANALISTA',
    senha: 'senha123'
  });
  assert.equal(servicoUsuario.buscarUsuarioPorId(cadastro.id).email, 'novo@exemplo.com');

  const atualizado = servicoUsuario.atualizarUsuario(cadastro.id, { email: '  EDITADO@EXEMPLO.COM ' });
  assert.equal(atualizado.email, 'editado@exemplo.com');
});

test('cadastro valida nome, e-mail, senha e perfil e aceita cargo descritivo', () => {
  assert.throws(() => servicoUsuario.criarUsuario({
    email: 'novo@exemplo.com',
    perfil: 'OPERACIONAL',
    senha: 'senha123'
  }), ErroNegocio);
  assert.throws(() => servicoUsuario.criarUsuario({
    nome: 'Usuário',
    email: 'novo@exemplo.com',
    cargo: 'Administrador de depósito',
    perfil: 'ADMIN',
    senha: 'senha123'
  }), ErroNegocio);
  const cadastroValido = servicoUsuario.criarUsuario({
    nome: ' Usuário ',
    email: ' NOVO@EXEMPLO.COM ',
    cargo: 'Administradora de depósito',
    perfil: 'ANALISTA',
    senha: 'senha123'
  });

  const cadastrado = servicoUsuario.buscarUsuarioPorId(cadastroValido.id);
  assert.equal(cadastrado.nome, 'Usuário');
  assert.equal(cadastrado.cargo, 'Administradora de depósito');
  assert.equal(cadastrado.perfil, 'ANALISTA');
});

test('edição valida campos parciais e rejeita e-mail já cadastrado', () => {
  const cadastro = servicoUsuario.criarUsuario({
    nome: 'Usuário',
    email: 'usuario@exemplo.com',
    perfil: 'OPERACIONAL',
    senha: 'senha123'
  });
  assert.throws(() => servicoUsuario.atualizarUsuario(cadastro.id, { email: ' GERENTE@TESTE.COM ' }), ErroNegocio);
  assert.throws(() => servicoUsuario.atualizarUsuario(cadastro.id, { perfil: 'ADMIN' }), ErroNegocio);
  assert.throws(() => servicoUsuario.atualizarUsuario(cadastro.id, {}), ErroNegocio);
});

test('protege contra desativação própria e remoção do último gerente ativo', () => {
  assert.throws(() => servicoUsuario.desativarUsuario(1, 1), ErroNegocio);
  assert.throws(() => servicoUsuario.atualizarUsuario(1, { perfil: 'ANALISTA' }), ErroNegocio);
  assert.throws(() => servicoUsuario.desativarUsuario(1, 999), ErroNegocio);
  assert.equal(servicoUsuario.buscarUsuarioPorId(1).ativo, true);
});

test('gerente redefine senha de outro usuário sem senha atual', () => {
  const cadastro = servicoUsuario.criarUsuario({
    nome: 'Usuário',
    email: 'usuario@exemplo.com',
    perfil: 'OPERACIONAL',
    senha: 'senha123'
  });
  const resultado = servicoUsuario.redefinirSenha(cadastro.id, 'novaSenha123');
  const login = servicoAutenticacao.realizarLogin('usuario@exemplo.com', 'novaSenha123');

  assert.equal(resultado.senha_alterada, true);
  assert.ok(login.token);
});
