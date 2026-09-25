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
  const camposPermitidos = ['nome', 'email', 'cargo', 'perfil'];
  const dadosParaAtualizar = {};

  for (const campo of camposPermitidos) {
    if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
      dadosParaAtualizar[campo] = req.body[campo];
    }
  }

  const resultado = servicoUsuario.atualizarUsuario(req.params.id, dadosParaAtualizar);
  return res.status(resultado.statusCode).json(resultado.payload);
}

function desativarUsuario(req, res) {
  const resultado = servicoUsuario.desativarUsuario(req.params.id, req.user.id);
  return res.status(resultado.statusCode).json(resultado.payload);
}

function reativarUsuario(req, res) {
  const resultado = servicoUsuario.reativarUsuario(req.params.id);
  return res.status(resultado.statusCode).json(resultado.payload);
}

function trocarSenha(req, res) {
  const usuarioId = req.user.id;
  const resultado = servicoUsuario.trocarSenha(usuarioId, req.body?.senhaAtual, req.body?.novaSenha);
  return res.status(resultado.statusCode).json(resultado.payload);
}

function redefinirSenha(req, res) {
  const resultado = servicoUsuario.redefinirSenha(req.params.id, req.body?.novaSenha, req.user.id);
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
  redefinirSenha,
  criarUsuario
};