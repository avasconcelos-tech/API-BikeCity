require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não definido. Configure essa variável antes de iniciar o servidor.');
}

module.exports = {
  SECRET: process.env.JWT_SECRET,
};
