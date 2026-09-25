const upload = require('../configuracoes/multer');

function processarUploadImagem(req, res, next) {
  upload.single('imagem')(req, res, (erro) => {
    if (!erro) return next();

    if (erro.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'erro',
        mensagem: 'Arquivo muito grande. O tamanho máximo permitido é 5MB.',
      });
    }

    return res.status(400).json({
      status: 'erro',
      mensagem: erro.message || 'Arquivo inválido',
    });
  });
}

module.exports = processarUploadImagem;
