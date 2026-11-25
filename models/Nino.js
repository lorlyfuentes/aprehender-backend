const mongoose = require("mongoose");

const ninoEsquema = new mongoose.Schema(
  {
    acudiente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Acudiente",
      required: true,
    },
    tipoDocumento: {
      type: String,
      required: true,
      enum: ["registro_civil", "tarjeta_identidad", "otro"],
    },
    numeroDocumento: { type: String, required: true },
    hashDocumento: { type: String, required: true, unique: true },
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    fechaNacimiento: { type: String, required: true },
    grado: {
      type: String,
      required: true,
      enum: ["transicion", "primero", "segundo", "tercero", "cuarto", "quinto"],
    },
    colegio: { type: String },
    docente: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    terapeuta: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    autorizacion: {
      aceptada: { type: Boolean, required: true },
      version: { type: String, required: true },
      fecha: { type: Date, required: true },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Nino", ninoEsquema);
