const banco = require('../src/repositorios/conexaoBanco');

async function corrigirProdutos() {
  const resultado = await banco.executar(
    `UPDATE produtos
     SET demanda_prevista = CAST(tipo_rastreabilidade AS UNSIGNED),
         tipo_rastreabilidade = estado_montagem,
         estado_montagem = dimensoes,
         dimensoes = NULL
     WHERE demanda_prevista IS NULL
       AND tipo_rastreabilidade REGEXP '^[0-9]+'
       AND estado_montagem IN ('NENHUMA', 'BATERIA', 'MOTOR_CONTROLADOR', 'VEICULO', 'PECA_SEGURANCA')
       AND dimensoes IN ('NAO_APLICA', 'MONTADO', 'DESMONTADO')`,
  );
  console.log(`${resultado.affectedRows} produto(s) corrigido(s).`);
}

corrigirProdutos()
  .catch((erro) => {
    console.error('Falha ao corrigir produtos:', erro);
    process.exitCode = 1;
  })
  .finally(() => banco.fecharBanco());
