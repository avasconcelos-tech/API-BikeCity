const express = require('express');
const upload = require('../configuracoes/multer');
const controladorUpload = require('../controladores/controladorUpload');
const { validarAutenticacao, autorizarPerfil } = require('../servicos/servicoAutenticacao');

const router = express.Router();

router.post('/imagens', validarAutenticacao, autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), (req, res, next) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'erro', mensagem: 'Arquivo muito grande. O tamanho máximo permitido é 5MB.' });
      }

      return res.status(400).json({ status: 'erro', mensagem: err.message || 'Arquivo inválido' });
    }

    return controladorUpload.vincularImagemProduto(req, res, next);
  });
});

module.exports = router;