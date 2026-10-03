const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');

router.post(
  '/registro',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('correo').isEmail().withMessage('El correo no es válido'),
    body('contrasena')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener mínimo 8 caracteres'),
    body('rol')
      .isIn(['docente', 'familia', 'institucion'])
      .withMessage('El rol no es válido'),
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
          .json({ mensaje: 'El correo ya esta registrado' });
      }

      const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
      const nuevoUsuario = new Usuario({
        nombre,
        correo,
        contrasena: contrasenaEncriptada,
        rol,
      });

      await nuevoUsuario.save();

      res.status(201).json({ mensaje: 'Usuario creado correctamente' });
    } catch (error) {
      res
        .status(500)
        .json({ mensaje: 'Error al crear el usuario', error: error.message });
    }
  },
);

module.exports = router;
