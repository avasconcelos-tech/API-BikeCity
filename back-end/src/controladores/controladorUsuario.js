const servicoUsuario = require('../servicos/servicoUsuario');
const asyncHandler = require('../middlewares/asyncHandler');

async function listarUsuarios(req, res) {
  const incluirInativos = req.query.incluirInativos === 'true';
  const usuarios = await servicoUsuario.listarUsuarios(incluirInativos);
  return res.status(200).json({ status: 'sucesso', dados: usuarios });
}

async function buscarUsuarioPorId(req, res) {
  const usuario = await servicoUsuario.buscarUsuarioPorId(req.params.id);
  return res.status(200).json({ status: 'sucesso', dados: usuario });
}

async function atualizarUsuario(req, res) {
  const camposPermitidos = ['nome', 'email', 'cargo', 'perfil'];
  const dadosParaAtualizar = {};

  for (const campo of camposPermitidos) {
    if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
      dadosParaAtualizar[campo] = req.body[campo];
    }
  }

  const usuario = await servicoUsuario.atualizarUsuario(req.params.id, dadosParaAtualizar);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Usuário atualizado com sucesso', dados: usuario });
}

async function desativarUsuario(req, res) {
  const usuario = await servicoUsuario.desativarUsuario(req.params.id, req.user.id);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Usuário desativado com sucesso', dados: usuario });
}

async function reativarUsuario(req, res) {
  const usuario = await servicoUsuario.reativarUsuario(req.params.id);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Usuário reativado com sucesso', dados: usuario });
}

async function trocarSenha(req, res) {
  const usuarioId = req.user.id;
  const dados = await servicoUsuario.trocarSenha(
    usuarioId,
    req.body?.senhaAtual,
    req.body?.novaSenha,
  );
  return res.status(200).json({ status: 'sucesso', mensagem: 'Senha alterada com sucesso', dados });
}

async function redefinirSenha(req, res) {
  const dados = await servicoUsuario.redefinirSenha(
    req.params.id,
    req.body?.novaSenha,
    req.user.id,
  );
  return res.status(200).json({ status: 'sucesso', mensagem: 'Senha alterada com sucesso', dados });
}

async function criarUsuario(req, res) {
  const dados = await servicoUsuario.criarUsuario(req.body);
  return res
    .status(201)
    .json({ status: 'sucesso', mensagem: 'Usuário cadastrado com sucesso', dados });
}

module.exports = {
  listarUsuarios: asyncHandler(listarUsuarios),
  buscarUsuarioPorId: asyncHandler(buscarUsuarioPorId),
  atualizarUsuario: asyncHandler(atualizarUsuario),
  desativarUsuario: asyncHandler(desativarUsuario),
  reativarUsuario: asyncHandler(reativarUsuario),
  trocarSenha: asyncHandler(trocarSenha),
  redefinirSenha: asyncHandler(redefinirSenha),
  criarUsuario: asyncHandler(criarUsuario),
};
