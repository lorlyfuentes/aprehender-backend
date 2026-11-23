const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Acudiente = require("../models/Acudiente");
const verificarToken = require("../middlewares/verificarToken");
const soloFamilia = require("../middlewares/soloFamilia");
const { encriptar, hashDocumento } = require("../utils/encriptacion");

const VERSION_AUTORIZACION = "v1-2026-11";

const validarAcudiente = [
  body("tipoDocumento")
    .isIn(["cedula_ciudadania", "cedula_extranjeria", "pasaporte", "otro"])
    .withMessage("El tipo de documento no es válido"),
  body("numeroDocumento")
    .trim()
    .notEmpty()
    .withMessage("El número de documento es obligatorio")
    .isAlphanumeric()
    .withMessage("El número de documento solo puede tener letras y números"),
  body("nombres").trim().notEmpty().withMessage("Los nombres son obligatorios"),
  body("apellidos").trim().notEmpty().withMessage("Los apellidos son obligatorios"),
  body("parentesco")
    .isIn([
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
    ])
    .withMessage("El parentesco no es válido"),
  body("celular").isMobilePhone("es-CO").withMessage("El celular no es válido"),
  body("ciudad").trim().notEmpty().withMessage("La ciudad es obligatoria"),
  body("aceptaAutorizacion")
    .custom((valor) => valor === true)
    .withMessage("Debes aceptar la autorización de tratamiento de datos personales"),
  body("esRepresentanteLegal")
    .custom((valor) => typeof valor === "boolean")
    .withMessage("Debes indicar si eres el representante legal del niño"),
];

router.post("/", verificarToken, soloFamilia, validarAcudiente, async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    const acudienteExistente = await Acudiente.findOne({ usuario: req.usuario.id });
    if (acudienteExistente) {
      return res
        .status(409)
        .json({ mensaje: "Ya registraste los datos del acudiente" });
    }

    const {
      tipoDocumento,
      numeroDocumento,
      nombres,
      apellidos,
      parentesco,
      celular,
      ciudad,
      esRepresentanteLegal,
    } = req.body;

    const hash = hashDocumento(numeroDocumento);
    const documentoRepetido = await Acudiente.findOne({ hashDocumento: hash });
    if (documentoRepetido) {
      return res
        .status(409)
        .json({ mensaje: "Este número de documento ya está registrado" });
    }

    const nuevoAcudiente = new Acudiente({
      usuario: req.usuario.id,
      tipoDocumento,
      numeroDocumento: encriptar(numeroDocumento),
      hashDocumento: hash,
      nombres: encriptar(nombres),
      apellidos: encriptar(apellidos),
      parentesco,
      celular: encriptar(celular),
      ciudad,
      autorizacion: {
        aceptada: true,
        esRepresentanteLegal,
        version: VERSION_AUTORIZACION,
        fecha: new Date(),
      },
    });

    await nuevoAcudiente.save();

    res.status(201).json({ mensaje: "Datos del acudiente guardados correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al guardar los datos del acudiente" });
  }
});

module.exports = router;
