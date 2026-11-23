const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const Usuario = require("../models/Usuario");

const verificarToken = require("../middlewares/verificarToken");
const soloAdmin = require("../middlewares/soloAdmin");

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  message: {
    mensaje: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos",
  },
});

router.post(
  "/registro",
  [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("correo").isEmail().withMessage("El correo no es válido"),
    body("contrasena")
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener mínimo 8 caracteres"),
    body("rol")
      .isIn(["docente", "familia", "terapeuta"])
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
        estadoCuenta: rol === "familia" ? "activa" : "pendiente",
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
  limiteLogin,
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

      if (usuario.estadoCuenta !== "activa") {
        return res
          .status(403)
          .json({ mensaje: "Tu cuenta está pendiente de activación por el administrador" });
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

    res.status(200).json({ usuario });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al obtener el perfil", error: error.message });
  }
});

router.get("/pendientes", verificarToken, soloAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.find({ estadoCuenta: { $ne: "activa" } }).select(
      "-contrasena",
    );

    res.status(200).json({ usuarios });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al listar las cuentas pendientes", error: error.message });
  }
});

router.put("/:id/activar", verificarToken, soloAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { estadoCuenta: "activa" },
      { returnDocument: "after" },
    ).select("-contrasena");

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.status(200).json({ mensaje: "Cuenta activada correctamente", usuario });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "Error al activar la cuenta", error: error.message });
  }
});

module.exports = router;
