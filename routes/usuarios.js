const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Usuario = require("../models/Usuario");

const verificarToken = require("../middlewares/verificarToken");

router.post(
  "/registro",
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("correo").isEmail().withMessage("El correo no es válido"),
    body("contrasena")
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener mínimo 8 caracteres"),
    body("rol")
      .isIn(["docente", "familia", "institucion"])
      .withMessage("El rol no es válido"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const { nombre, correo, contrasena, rol } = req.body;

      const usuarioExistente = await Usuario.findOne({ correo });
      if (usuarioExistente) {
        return res
          .status(409)
          .json({ mensaje: "El correo ya está registrado" });
      }

      const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
      const nuevoUsuario = new Usuario({
        nombre,
        correo,
        contrasena: contrasenaEncriptada,
        rol,
      });

      await nuevoUsuario.save();

      res.status(201).json({ mensaje: "Usuario creado correctamente" });
    } catch (error) {
      res
        .status(500)
        .json({ mensaje: "Error al crear el usuario", error: error.message });
    }
  },
);

router.post(
  "/login",
  [
    body("correo").isEmail().withMessage("El correo no es válido"),
    body("contrasena").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    try {
      const { correo, contrasena } = req.body;

      const usuario = await Usuario.findOne({ correo });
      if (!usuario) {
        return res
          .status(401)
          .json({ mensaje: "Correo o contraseña incorrectos" });
      }

      const contrasenaValida = await bcrypt.compare(
        contrasena,
        usuario.contrasena,
      );
      if (!contrasenaValida) {
        return res
          .status(401)
          .json({ mensaje: "Correo o contraseña incorrectos" });
      }

      const token = jwt.sign(
        { id: usuario._id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      res.status(200).json({ mensaje: "Inicio de sesión exitoso", token });
    } catch (error) {
      res
        .status(500)
        .json({ mensaje: "Error al iniciar sesión", error: error.message });
    }
  },
);

router.get("/perfil", verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select("-contrasena");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (usuario.estadoPago !== "activo") {
      return res
        .status(403)
        .json({ mensaje: "Acceso denegado: el pago no está activo" });
    }

    res.status(200).json({ usuario });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener el perfil", error: error.message });
  }
});

module.exports = router;
