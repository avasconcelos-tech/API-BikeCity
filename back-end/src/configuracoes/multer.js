const multer = require('multer');
const path = require('path');
const fs = require('fs');

const diretorioUploads = path.join(__dirname, '../../uploads');

if (!fs.existsSync(diretorioUploads)) {
  fs.mkdirSync(diretorioUploads, { recursive: true });
}

const extensoesPermitidas = new Set(['.png', '.jpg', '.jpeg']);
const mimetypesPermitidos = new Set(['image/png', 'image/jpeg', 'image/jpg']);

const armazenamento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, diretorioUploads),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const extensaoSegura = extensoesPermitidas.has(ext) ? ext : '.png';
    const nomeArquivo = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensaoSegura}`;
    cb(null, nomeArquivo);
  }
});

const upload = multer({
  storage: armazenamento,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetypeValido = mimetypesPermitidos.has(file.mimetype);

    // Valida tanto a extensão quanto o tipo MIME do arquivo enviado
    if (extensoesPermitidas.has(ext) && mimetypeValido) {
      cb(null, true);
      return;
    }

    cb(new Error('Apenas arquivos de imagem válidos (PNG, JPG, JPEG) são permitidos'));
  }
});

module.exports = upload;