const mongoose = require('mongoose');

const nombreEsquema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contrasena: { type: String, required: true },
  rol: { type: String, required: true, enum: ['docente', 'familia', 'institucion'] },
  estadoPago: { type: String, default: 'pendiente' }
});

module.exports = mongoose.model('Usuario', nombreEsquema);
