const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Nino = require("../models/Nino");
const Acudiente = require("../models/Acudiente");
const verificarToken = require("../middlewares/verificarToken");
const soloFamilia = require("../middlewares/soloFamilia");
const soloAdmin = require("../middlewares/soloAdmin");
const { encriptar, desencriptar, hashDocumento } = require("../utils/encriptacion");

const VERSION_AUTORIZACION = "v1-2026-11";
const PARENTESCOS_REPRESENTANTE = ["madre", "padre", "tutor_legal"];

const validarNino = [
  body("tipoDocumento")
    .isIn(["registro_civil", "tarjeta_identidad", "otro"])
    .withMessage("El tipo de documento no es válido"),
  body("numeroDocumento")
    .trim()
    .notEmpty()
    .withMessage("El número de documento es obligatorio")
    .isAlphanumeric()
    .withMessage("El número de documento solo puede tener letras y números"),
  body("nombres").trim().notEmpty().withMessage("Los nombres son obligatorios"),
  body("apellidos").trim().notEmpty().withMessage("Los apellidos son obligatorios"),
  body("fechaNacimiento")
    .isISO8601()
    .withMessage("La fecha de nacimiento debe tener el formato AAAA-MM-DD")
    .custom((valor) => new Date(valor) < new Date())
    .withMessage("La fecha de nacimiento debe ser anterior a hoy"),
  body("grado")
    .isIn(["transicion", "primero", "segundo", "tercero", "cuarto", "quinto"])
    .withMessage("El grado no es válido"),
  body("colegio").optional().trim(),
  body("aceptaAutorizacion")
    .custom((valor) => valor === true)
    .withMessage("Debes aceptar la autorización de tratamiento de datos del niño"),
];

router.post("/", verificarToken, soloFamilia, validarNino, async (req, res) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    const acudiente = await Acudiente.findOne({ usuario: req.usuario.id });
    if (!acudiente) {
      return res
        .status(400)
        .json({ mensaje: "Primero debes registrar los datos del acudiente" });
    }

    if (
      !PARENTESCOS_REPRESENTANTE.includes(acudiente.parentesco) ||
      !acudiente.autorizacion.esRepresentanteLegal
    ) {
      return res.status(403).json({
        mensaje:
          "Solo el representante legal del niño (madre, padre o tutor legal) puede registrarlo",
      });
    }

    const {
      tipoDocumento,
      numeroDocumento,
      nombres,
      apellidos,
      fechaNacimiento,
      grado,
      colegio,
    } = req.body;

    const hash = hashDocumento(numeroDocumento);
    const documentoRepetido = await Nino.findOne({ hashDocumento: hash });
    if (documentoRepetido) {
      return res
        .status(409)
        .json({ mensaje: "Este número de documento ya está registrado" });
    }

    const nuevoNino = new Nino({
      acudiente: acudiente._id,
      tipoDocumento,
      numeroDocumento: encriptar(numeroDocumento),
      hashDocumento: hash,
      nombres: encriptar(nombres),
      apellidos: encriptar(apellidos),
      fechaNacimiento: encriptar(fechaNacimiento),
      grado,
      colegio,
      autorizacion: {
        aceptada: true,
        version: VERSION_AUTORIZACION,
        fecha: new Date(),
      },
    });

    await nuevoNino.save();

    res
      .status(201)
      .json({ mensaje: "Niño registrado correctamente", id: nuevoNino._id });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al registrar al niño" });
  }
});

router.get("/", verificarToken, soloFamilia, async (req, res) => {
  try {
    const acudiente = await Acudiente.findOne({ usuario: req.usuario.id });
    if (!acudiente) {
      return res.status(200).json({ ninos: [] });
    }

    const ninos = await Nino.find({ acudiente: acudiente._id }).sort({ createdAt: 1 });

    const ninosLegibles = ninos.map((nino) => ({
      id: nino._id,
      tipoDocumento: nino.tipoDocumento,
      numeroDocumento: desencriptar(nino.numeroDocumento),
      nombres: desencriptar(nino.nombres),
      apellidos: desencriptar(nino.apellidos),
      fechaNacimiento: desencriptar(nino.fechaNacimiento),
      grado: nino.grado,
      colegio: nino.colegio,
    }));

    res.status(200).json({ ninos: ninosLegibles });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los niños" });
  }
});

router.get("/sin-asignar", verificarToken, soloAdmin, async (req, res) => {
  try {
    const ninos = await Nino.find({
      $or: [{ docente: null }, { terapeuta: null }],
    }).sort({ createdAt: 1 });

    const ninosLegibles = ninos.map((nino) => ({
      id: nino._id,
      nombres: desencriptar(nino.nombres),
      apellidos: desencriptar(nino.apellidos),
      grado: nino.grado,
      colegio: nino.colegio,
      docente: nino.docente,
      terapeuta: nino.terapeuta,
    }));

    res.status(200).json({ ninos: ninosLegibles });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al listar los niños sin asignar" });
  }
});

module.exports = router;
