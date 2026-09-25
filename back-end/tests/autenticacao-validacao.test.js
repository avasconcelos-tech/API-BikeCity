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
  assert.equal(atualizado.email, 'editado@exemplo.com');
});
