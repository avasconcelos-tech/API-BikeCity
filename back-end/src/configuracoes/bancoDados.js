const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const caminhoBanco = path.join(__dirname, '../../database.sqlite');
const caminhoScriptSql = path.join(__dirname, '../../Db_bikecity.sqlite.sql');

const db = new sqlite3.Database(caminhoBanco, (erro) => {
  if (erro) {
    console.error('Erro ao conectar ao banco:', erro.message);
    return;
  }

  if (fs.existsSync(caminhoScriptSql)) {
    const scriptSql = fs.readFileSync(caminhoScriptSql, 'utf8');
    db.exec(scriptSql, (erroExec) => {
      if (erroExec) {
        console.error('Erro ao executar script SQL:', erroExec.message);
        return;
      }

      db.run(
        `INSERT OR IGNORE INTO usuarios (id, nome, email, senha_hash, cargo, perfil, ativo, tentativas_falhas, bloqueado_until) 
         VALUES (1, 'Gerente Teste', 'gerente@teste.com', '$2a$10$QYy6qwIhAmxI5.4G8LyPqO1nYh0fDTRzg3LMR9c7iO8Jk/yA7E0ja', 'Gerente', 'GERENTE', 1, 0, NULL)`,
        (erroInsercao) => {
          if (erroInsercao) {
            console.error('Erro ao inserir usuário inicial:', erroInsercao.message);
          }
        }
      );
    });
  }
});

module.exports = db;