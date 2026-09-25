const servicoImagemProduto = require('../servicos/servicoImagemProduto');

async function vincularImagemProduto(req, res, next) {
  try {
    const produtoId = req.params.id ?? req.body?.produto_id;
    const dados = await servicoImagemProduto.vincularImagem(produtoId, req.file);
    const mensagem = req.params.id
      ? 'Imagem do produto enviada com sucesso'
      : 'Imagem enviada e vinculada ao produto com sucesso';
    return res.status(201).json({ status: 'sucesso', mensagem, dados });
  } catch (erro) {
    return next(erro);
  }
}

module.exports = {
  vincularImagemProduto,
};
