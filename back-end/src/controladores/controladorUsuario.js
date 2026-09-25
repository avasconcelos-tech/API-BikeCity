const servicoUsuario = require('../servicos/servicoUsuario');

function listarUsuarios(req, res) {
  const incluirInativos = req.query.incluirInativos === 'true';
  const usuarios = servicoUsuario.listarUsuarios(incluirInativos);
  return res.status(200).json({ status: 'sucesso', dados: usuarios });
}

function buscarUsuarioPorId(req, res) {
  const usuario = servicoUsuario.buscarUsuarioPorId(req.params.id);
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

  const usuario = servicoUsuario.atualizarUsuario(req.params.id, dadosParaAtualizar);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Usuário atualizado com sucesso', dados: usuario });
}

function desativarUsuario(req, res) {
  const usuario = servicoUsuario.desativarUsuario(req.params.id, req.user.id);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Usuário desativado com sucesso', dados: usuario });
}

function reativarUsuario(req, res) {
  const usuario = servicoUsuario.reativarUsuario(req.params.id);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Usuário reativado com sucesso', dados: usuario });
}

function trocarSenha(req, res) {
  const usuarioId = req.user.id;
  const dados = servicoUsuario.trocarSenha(usuarioId, req.body?.senhaAtual, req.body?.novaSenha);
  return res.status(200).json({ status: 'sucesso', mensagem: 'Senha alterada com sucesso', dados });
}

function redefinirSenha(req, res) {
  const dados = servicoUsuario.redefinirSenha(req.params.id, req.body?.novaSenha, req.user.id);
  return res.status(200).json({ status: 'sucesso', mensagem: 'Senha alterada com sucesso', dados });
}

function criarUsuario(req, res) {
  const dados = servicoUsuario.criarUsuario(req.body);
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Usuário cadastrado com sucesso', dados });
}

module.exports = {
  listarUsuarios,
  buscarUsuarioPorId,
  atualizarUsuario,
  desativarUsuario,
  reativarUsuario,
  trocarSenha,
  redefinirSenha,
  criarUsuario,
};
