const mongoose = require("mongoose");

const acudienteEsquema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      unique: true,
    },
    tipoDocumento: {
      type: String,
      required: true,
      enum: ["cedula_ciudadania", "cedula_extranjeria", "pasaporte", "otro"],
    },
    numeroDocumento: { type: String, required: true },
    hashDocumento: { type: String, required: true, unique: true },
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    parentesco: {
      type: String,
      required: true,
      enum: [
        "madre",
        "padre",
        "abuela",
        "abuelo",
        "tia",
        "tio",
        "hermana",
        "hermano",
        "madrastra",
        "padrastro",
        "madrina",
        "padrino",
        "tutor_legal",
        "otro",
      ],
    },
    celular: { type: String, required: true },
    ciudad: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Acudiente", acudienteEsquema);