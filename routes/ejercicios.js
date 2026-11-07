const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Ejercicio = require("../models/Ejercicio");
const verificarToken = require("../middlewares/verificarToken");
const soloDocente = require("../middlewares/soloDocente");

router.post(
  "/",
  verificarToken,
  soloDocente,
  [
    body("titulo").notEmpty().withMessage("El título es obligatorio"),
    body("nivel")
      .isIn(["Exploradores", "Aventureros", "Expertos"])
      .withMessage("El nivel no es válido"),
    body("consigna").notEmpty().withMessage("La consigna es obligatoria"),
    body("opciones")
      .isArray({ min: 2 })
      .withMessage("Debe haber mínimo 2 opciones"),
    body("respuestaCorrecta")
      .custom((valor, { req }) => req.body.opciones.includes(valor))
      .withMessage("La respuesta correcta debe estar entre las opciones"),
    body("pista").optional().isString().withMessage("La pista debe ser texto"),
    body("esMuestra")
      .optional()
      .isBoolean()
      .withMessage("esMuestra debe ser true o false"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const {
        titulo,
        nivel,
        consigna,
        opciones,
        respuestaCorrecta,
        pista,
        esMuestra,
      } = req.body;

      const nuevoEjercicio = new Ejercicio({
        titulo,
        nivel,
        consigna,
        opciones,
        respuestaCorrecta,
        pista,
        esMuestra,
        creadoPor: req.usuario.id,
      });

      await nuevoEjercicio.save();

      res
        .status(201)
        .json({
          mensaje: "Ejercicio creado correctamente",
          ejercicio: nuevoEjercicio,
        });
    } catch (error) {
      res
        .status(500)
        .json({ mensaje: "Error al crear el ejercicio", error: error.message });
    }
  },
);

module.exports = router;
