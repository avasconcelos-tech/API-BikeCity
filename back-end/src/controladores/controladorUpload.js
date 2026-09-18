function fazerUploadImagem(req, res) {
  if (!req.file) {
    return res.status(400).json({ status: 'erro', mensagem: 'Arquivo de imagem inválido ou ausente' });
  }

  const caminhoRelativo = `/uploads/${req.file.filename}`;

  return res.status(201).json({
    status: 'sucesso',
    dados: {
      caminho: caminhoRelativo
    }
  });
}

module.exports = {
  fazerUploadImagem
};