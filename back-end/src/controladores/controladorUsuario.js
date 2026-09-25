const servicoUsuario = require('../servicos/servicoUsuario');

function listarUsuarios(req, res) {
  const incluirInativos = req.query.incluirInativos === 'true';
  const usuarios = servicoUsuario.listarUsuarios(incluirInativos);
  return res.status(200).json({ status: 'sucesso', dados: usuarios });
}

function buscarUsuarioPorId(req, res) {
  const usuario = servicoUsuario.buscarUsuarioPorId(req.params.id);
  if (!usuario) {
    return res.status(404).json({ status: 'erro', mensagem: 'Usuário não encontrado' });
  }

  return res.status(200).json({ status: 'sucesso', dados: usuario });
}

function atualizarUsuario(req, res) {
  const usuario = servicoUsuario.buscarUsuarioPorId(req.params.id);
  if (!usuario) {
    return res.status(404).json({ status: 'erro', mensagem: 'Usuário não encontrado' });
  }

  const camposPermitidos = ['nome', 'email', 'cargo', 'perfil'];
  const dadosParaAtualizar = {};

  for (const campo of camposPermitidos) {
    if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
      dadosParaAtualizar[campo] = req.body[campo];
    }
  }

  const usuarioAtualizado = servicoUsuario.atualizarUsuario(req.params.id, dadosParaAtualizar);
  return res.status(200).json({ status: 'sucesso', mensagem: 'Usuário atualizado com sucesso', dados: usuarioAtualizado });
}

function desativarUsuario(req, res) {
  const usuario = servicoUsuario.buscarUsuarioPorId(req.params.id);
  if (!usuario) {
    return res.status(404).json({ status: 'erro', mensagem: 'Usuário não encontrado' });
  }

  const usuarioDesativado = servicoUsuario.desativarUsuario(req.params.id);
  return res.status(200).json({ status: 'sucesso', mensagem: 'Usuário desativado com sucesso', dados: usuarioDesativado });
}

function reativarUsuario(req, res) {
  const usuario = servicoUsuario.buscarUsuarioPorId(req.params.id);
  if (!usuario) return res.status(404).json({ status: 'erro', mensagem: 'Usuário não encontrado' });
  const usuarioReativado = servicoUsuario.reativarUsuario(req.params.id);
  return res.status(200).json({ status: 'sucesso', mensagem: 'Usuário reativado com sucesso', dados: usuarioReativado });
}

function trocarSenha(req, res) {
  const usuarioId = req.user.id;
  const resultado = servicoUsuario.trocarSenha(usuarioId, req.body.senhaAtual, req.body.novaSenha);
  return res.status(resultado.statusCode).json(resultado.payload);
}

function criarUsuario(req, res) {
  const result = servicoUsuario.criarUsuario(req.body);
  return res.status(result.statusCode).json(result.payload);
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