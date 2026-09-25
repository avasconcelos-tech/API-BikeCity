const servicoAutenticacao = require('../servicos/servicoAutenticacao');
const asyncHandler = require('../middlewares/asyncHandler');

async function login(req, res) {
  const dados = await servicoAutenticacao.realizarLogin(req.body.email, req.body.senha);
  return res
    .status(200)
    .json({ status: 'sucesso', mensagem: 'Login realizado com sucesso', dados });
}

module.exports = {
  login: asyncHandler(login),
};
