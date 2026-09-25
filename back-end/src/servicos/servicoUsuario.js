const bcrypt = require('bcryptjs');
const repositorio = require('../repositorios/repositorioUsuario');

function listarUsuarios(incluirInativos = false) {
  return repositorio.listarUsuarios(incluirInativos);
}

function buscarUsuarioPorId(id) {
  return repositorio.buscarUsuarioPorId(id);
}

function atualizarUsuario(id, dadosParaAtualizar) {
  const dados = { ...dadosParaAtualizar };
  if (typeof dados.email === 'string') {
    dados.email = dados.email.trim().toLowerCase();
  }
  return repositorio.atualizarUsuario(id, dados);
}

function desativarUsuario(id) {
  return repositorio.desativarUsuario(id);
}

function reativarUsuario(id) {
  return repositorio.reativarUsuario(id);
}

function trocarSenha(id, senhaAtual, novaSenha) {
  if (typeof senhaAtual !== 'string' || typeof novaSenha !== 'string') {
    return { statusCode: 400, payload: { status: 'erro', mensagem: 'As senhas são obrigatórias e devem ser textos.' } };
  }

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
  if (typeof data.senha !== 'string' || data.senha.trim().length < 6) {
    return {
      statusCode: 400,
      payload: { status: 'erro', mensagem: 'A senha deve ter pelo menos 6 caracteres' }
    };
  }

  const dados = {
    ...data,
    email: typeof data.email === 'string' ? data.email.trim().toLowerCase() : data.email
  };

  const existe = repositorio.buscarUsuarioPorEmail(dados.email);
  if (existe) {
    return {
      statusCode: 409,
      payload: { status: 'erro', mensagem: 'E-mail já cadastrado' }
    };
  }

  const usuario = repositorio.criarUsuario(dados);
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
  reativarUsuario,
  trocarSenha,
  criarUsuario
};