const mongoose = require('mongoose');

const ejercicioEsquema = new mongoose.Schema({
  titulo: { type: String, required: true },
  nivel: { type: String, required: true, enum: ['Exploradores', 'Aventureros', 'Expertos'] },
  consigna: { type: String, required: true },
  opciones: { type: [String], required: true },
  respuestaCorrecta: { type: String, required: true },
  pista: { type: String },
  esMuestra: { type: Boolean, default: false },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Ejercicio', ejercicioEsquema);