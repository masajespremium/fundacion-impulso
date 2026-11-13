require('dotenv').config();
const app = require('./api-app');
const express = require('express');
const path = require('path');
const {sincronizar} = require('./sincronizar-solicitudes');

app.use(express.static(path.join(__dirname, 'public'), {index: 'index.html', dotfiles: 'deny'}));
app.listen(Number(process.env.PORT) || 3000, () => {
  console.log('Fundación Impulso en http://localhost:' + (process.env.PORT || 3000));
  // La sincronización se ejecuta solo en el equipo donde arranca este servidor.
  sincronizar();
  setInterval(sincronizar, 60 * 1000);
});
