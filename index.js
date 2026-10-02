require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const usuariosRoutes = require('./routes/usuarios');

const app = express();
app.use(express.json());
app.use('/api/usuarios', usuariosRoutes);

const PORT = process.env.PORT;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log('Error al conectar a MongoDB:', error.message);
  });
  