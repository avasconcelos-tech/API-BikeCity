require('dotenv').config();

module.exports = {
  SECRET: process.env.JWT_SECRET || 'chave_secreta_padrao'
};