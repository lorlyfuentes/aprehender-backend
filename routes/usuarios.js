const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
router.post('/registro', async (req, res) => {
  try {
    const { nombre, correo, contrasena, rol } = req.body;


    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) {
      return res.status(409).json({ mensaje: "El correo ya esta registrado"});
    }


    const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      contrasena: contrasenaEncriptada,
      rol
    });

    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
  }
});

module.exports = router;