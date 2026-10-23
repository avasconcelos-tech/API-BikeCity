const servicoAutenticacao = require('../servicos/servicoAutenticacao');
const asyncHandler = require('../middlewares/asyncHandler');

async function login(req, res) {
  const body = req.body || {};
  const dados = await servicoAutenticacao.realizarLogin(body.email, body.senha);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Login realizado com sucesso', dados });
}

module.exports = {
  login: asyncHandler(login),
};
