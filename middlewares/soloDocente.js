const soloDocente = (req, res, next) => {
  if (req.usuario.rol !== "docente") {
    return res
      .status(403)
      .json({
        mensaje: "Acceso denegado: solo el docente puede realizar esta acción",
      });
  }
  next();
};

module.exports = soloDocente;
