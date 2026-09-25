const express = require('express');
const fs = require('fs');
const upload = require('../configuracoes/multer');
const { validarAutenticacao, autorizarPerfil } = require('../servicos/servicoAutenticacao');

const router = express.Router();

router.post('/imagens', validarAutenticacao, autorizarPerfil('OPERACIONAL', 'ANALISTA', 'GERENTE'), (req, res) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ status: 'erro', mensagem: 'Arquivo muito grande. O tamanho máximo permitido é 5MB.' });
      }

      return res.status(400).json({ status: 'erro', mensagem: err.message || 'Arquivo inválido' });
    }

    if (!req.file) {
      return res.status(400).json({ status: 'erro', mensagem: 'Nenhuma imagem enviada' });
    }

    try {
      // Importação dinâmica para contornar módulo ESM
      const { fileTypeFromBuffer } = await import('file-type');
      const dadosArquivo = await fs.promises.readFile(req.file.path);
      const tipoArquivo = await fileTypeFromBuffer(dadosArquivo);

      if (!tipoArquivo || !['image/png', 'image/jpeg'].includes(tipoArquivo.mime)) {
        await fs.promises.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ status: 'erro', mensagem: 'Arquivo inválido: apenas imagens PNG e JPG/JPEG válidas.' });
      }

      return res.status(201).json({
        status: 'sucesso',
        mensagem: 'Imagem enviada com sucesso',
        dados: {
          nomeArquivo: req.file.filename,
          caminho: `/uploads/${req.file.filename}`
        }
      });
    } catch (error) {
      return res.status(400).json({ status: 'erro', mensagem: 'Arquivo inválido' });
    }
  });
});

module.exports = router;