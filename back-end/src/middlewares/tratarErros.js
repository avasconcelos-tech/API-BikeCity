const ErroNegocio = require('../erros/ErroNegocio');

function tratarErros(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'erro', mensagem: 'JSON malformado no corpo da requisição.' });
  }
  if (err instanceof ErroNegocio) {
    return res.status(err.status).json({ status: 'erro', mensagem: err.message });
  }
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.code === 'ER_DUP_ENTRY' || /UNIQUE constraint failed/i.test(err.message || '')) {
    return res.status(409).json({ status: 'erro', mensagem: 'Já existe um registro com esses dados.' });
  }

  console.error(err);
  return res.status(500).json({ status: 'erro', mensagem: 'Erro interno do servidor' });
}

module.exports = tratarErros;