const test = require('node:test');
const assert = require('node:assert/strict');
const conexaoBanco = require('../src/repositorios/conexaoBanco');
const servicoAutenticacao = require('../src/servicos/servicoAutenticacao');
const servicoUsuario = require('../src/servicos/servicoUsuario');

test.beforeEach(() => conexaoBanco.resetarBancoParaTestes());

test('login rejeita credenciais ausentes ou com senha não textual', () => {
  const semSenha = servicoAutenticacao.loginUser('gerente@teste.com', undefined);
  const senhaNumerica = servicoAutenticacao.loginUser('gerente@teste.com', 123);

  assert.equal(semSenha.statusCode, 400);
  assert.equal(senhaNumerica.statusCode, 400);
});

test('login normaliza e-mail sem diferenciar maiúsculas e minúsculas', () => {
  const resultado = servicoAutenticacao.loginUser('  GERENTE@TESTE.COM  ', 'senha123');

  assert.equal(resultado.statusCode, 200);
});

test('troca de senha rejeita valores que não sejam textos', () => {
  const semSenhaAtual = servicoUsuario.trocarSenha(1, undefined, 'nova123');
  const senhaAtualNumerica = servicoUsuario.trocarSenha(1, 123, 'nova123');

  assert.equal(semSenhaAtual.statusCode, 400);
  assert.equal(senhaAtualNumerica.statusCode, 400);
});

test('cadastro e edição normalizam o e-mail', () => {
  const cadastro = servicoUsuario.criarUsuario({
    nome: 'Usuário Normalizado',
    email: '  NOVO@EXEMPLO.COM ',
    cargo: 'Analista',
    perfil: 'ANALISTA',
    senha: 'senha123'
  });
  assert.equal(cadastro.statusCode, 201);
  assert.equal(servicoUsuario.buscarUsuarioPorId(cadastro.payload.dados.id).email, 'novo@exemplo.com');

  const atualizado = servicoUsuario.atualizarUsuario(cadastro.payload.dados.id, { email: '  EDITADO@EXEMPLO.COM ' });
  assert.equal(atualizado.statusCode, 200);
  assert.equal(atualizado.payload.dados.email, 'editado@exemplo.com');
});

test('cadastro valida nome, e-mail, senha e perfil e aceita cargo descritivo', () => {
  const semNome = servicoUsuario.criarUsuario({
    email: 'novo@exemplo.com',
    perfil: 'OPERACIONAL',
    senha: 'senha123'
  });
  const perfilInvalido = servicoUsuario.criarUsuario({
    nome: 'Usuário',
    email: 'novo@exemplo.com',
    cargo: 'Administrador de depósito',
    perfil: 'ADMIN',
    senha: 'senha123'
  });
  const cadastroValido = servicoUsuario.criarUsuario({
    nome: ' Usuário ',
    email: ' NOVO@EXEMPLO.COM ',
    cargo: 'Administradora de depósito',
    perfil: 'ANALISTA',
    senha: 'senha123'
  });

  assert.equal(semNome.statusCode, 400);
  assert.equal(perfilInvalido.statusCode, 400);
  assert.equal(cadastroValido.statusCode, 201);
  const cadastrado = servicoUsuario.buscarUsuarioPorId(cadastroValido.payload.dados.id);
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
  const eMailDuplicado = servicoUsuario.atualizarUsuario(cadastro.payload.dados.id, {
    email: ' GERENTE@TESTE.COM '
  });
  const perfilInvalido = servicoUsuario.atualizarUsuario(cadastro.payload.dados.id, { perfil: 'ADMIN' });
  const vazio = servicoUsuario.atualizarUsuario(cadastro.payload.dados.id, {});

  assert.equal(eMailDuplicado.statusCode, 409);
  assert.equal(perfilInvalido.statusCode, 400);
  assert.equal(vazio.statusCode, 400);
});

test('protege contra desativação própria e remoção do último gerente ativo', () => {
  const desativacaoPropria = servicoUsuario.desativarUsuario(1, 1);
  const rebaixamento = servicoUsuario.atualizarUsuario(1, { perfil: 'ANALISTA' });
  const protecaoDesativacaoUltimoGerente = servicoUsuario.desativarUsuario(1, 999);

  assert.equal(desativacaoPropria.statusCode, 400);
  assert.equal(rebaixamento.statusCode, 409);
  assert.equal(protecaoDesativacaoUltimoGerente.statusCode, 409);
  assert.equal(servicoUsuario.buscarUsuarioPorId(1).ativo, true);
});

test('gerente redefine senha de outro usuário sem senha atual', () => {
  const cadastro = servicoUsuario.criarUsuario({
    nome: 'Usuário',
    email: 'usuario@exemplo.com',
    perfil: 'OPERACIONAL',
    senha: 'senha123'
  });
  const resultado = servicoUsuario.redefinirSenha(cadastro.payload.dados.id, 'novaSenha123');
  const login = servicoAutenticacao.loginUser('usuario@exemplo.com', 'novaSenha123');

  assert.equal(resultado.statusCode, 200);
  assert.equal(login.statusCode, 200);
});
