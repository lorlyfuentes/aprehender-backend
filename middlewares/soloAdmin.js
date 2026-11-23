const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== "admin") {
    return res
      .status(403)
      .json({
        mensaje: "Acceso denegado: solo el administrador puede realizar esta acción",
      });
  }
  next();
};

module.exports = soloAdmin;
