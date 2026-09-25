const conexaoBanco = require('../src/repositorios/conexaoBanco');
const db = conexaoBanco.getDb();

const resultado = db.prepare(`
  UPDATE produtos
  SET dimensoes = NULL,
      estado_montagem = dimensoes,
      tipo_rastreabilidade = estado_montagem,
      demanda_prevista = CAST(tipo_rastreabilidade AS INTEGER)
  WHERE demanda_prevista IS NULL
    AND tipo_rastreabilidade GLOB '[0-9]*'
    AND estado_montagem IN ('NENHUMA', 'BATERIA', 'MOTOR_CONTROLADOR', 'VEICULO', 'PECA_SEGURANCA')
    AND dimensoes IN ('NAO_APLICA', 'MONTADO', 'DESMONTADO')
`).run();

console.log(`${resultado.changes} produto(s) corrigido(s).`);
