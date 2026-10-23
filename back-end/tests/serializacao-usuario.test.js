const test = require('node:test');
const assert = require('node:assert/strict');
const servicoUsuario = require('../src/servicos/servicoUsuario');
const controladorUsuario = require('../src/controladores/controladorUsuario');

test('user details never expose password hashes or login lockout state', async () => {
  const originalBuscarUsuario = servicoUsuario.buscarUsuarioPorId;
  servicoUsuario.buscarUsuarioPorId = async () => ({
    id: 7,
    nome: 'Usuário',
    email: 'usuario@exemplo.com',
    senha_hash: 'hash-interno',
    tentativas_falhas: 2,
    bloqueado_until: new Date(),
    ativo: true,
  });

  let resposta;
  const response = {
    status() {
      return this;
    },
    json(body) {
      resposta = body;
      return this;
    },
  };

  try {
    await controladorUsuario.buscarUsuarioPorId({ params: { id: '7' } }, response);
  } finally {
    servicoUsuario.buscarUsuarioPorId = originalBuscarUsuario;
  }

  assert.deepEqual(resposta.dados, {
    id: 7,
    nome: 'Usuário',
    email: 'usuario@exemplo.com',
    ativo: true,
  });
});
