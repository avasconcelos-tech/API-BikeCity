const bcrypt = require('bcryptjs');
const repositorio = require('../repositorios/repositorioUsuario');

function listarUsuarios(incluirInativos = false) {
  return repositorio.listarUsuarios(incluirInativos);
}

function buscarUsuarioPorId(id) {
  return repositorio.buscarUsuarioPorId(id);
}

function atualizarUsuario(id, dadosParaAtualizar) {
  return repositorio.atualizarUsuario(id, dadosParaAtualizar);
}

function desativarUsuario(id) {
  return repositorio.desativarUsuario(id);
}

function trocarSenha(id, senhaAtual, novaSenha) {
  const usuario = repositorio.buscarUsuarioPorId(id);
  if (!usuario) {
    return { statusCode: 404, payload: { status: 'erro', mensagem: 'Usuário não encontrado' } };
  }

  const senhaAtualValida = bcrypt.compareSync(senhaAtual, usuario.senha_hash);
  if (!senhaAtualValida) {
    return { statusCode: 400, payload: { status: 'erro', mensagem: 'Senha atual incorreta' } };
  }

  if (!novaSenha || String(novaSenha).trim().length < 6) {
    return { statusCode: 400, payload: { status: 'erro', mensagem: 'A nova senha deve ter pelo menos 6 caracteres' } };
  }

  const novaSenhaHash = bcrypt.hashSync(novaSenha, 10);
  repositorio.atualizarSenha(id, novaSenhaHash);

  return {
    statusCode: 200,
    payload: {
      status: 'sucesso',
      mensagem: 'Senha alterada com sucesso',
      dados: { senha_alterada: true }
    }
  };
}

function criarUsuario(data) {
  if (!data.senha || String(data.senha).trim().length < 6) {
    return {
      statusCode: 400,
      payload: { status: 'erro', mensagem: 'A senha deve ter pelo menos 6 caracteres' }
    };
  }

  const existe = repositorio.buscarUsuarioPorEmail(data.email);
  if (existe) {
    return {
      statusCode: 409,
      payload: { status: 'erro', mensagem: 'E-mail já cadastrado' }
    };
  }

  const usuario = repositorio.criarUsuario(data);
  return {
    statusCode: 201,
    payload: {
      status: 'sucesso',
      mensagem: 'Usuário cadastrado com sucesso',
      dados: { id: usuario.id }
    }
  };
}

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  desativarUsuario,
  trocarSenha,
  criarUsuario
};