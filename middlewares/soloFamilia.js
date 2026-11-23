const soloFamilia = (req, res, next) => {
  if (req.usuario.rol !== "familia") {
    return res
      .status(403)
      .json({
        mensaje: "Acceso denegado: solo la familia puede realizar esta acción",
      });
  }
  next();
};

module.exports = soloFamilia;
