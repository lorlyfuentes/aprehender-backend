const crypto = require("crypto");

const ALGORITMO = "aes-256-gcm";
const clave = Buffer.from(process.env.CLAVE_ENCRIPTACION, "hex");

const encriptar = (texto) => {
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv(ALGORITMO, clave, iv);
  const datos = Buffer.concat([cifrador.update(texto, "utf8"), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();

  return [iv.toString("hex"), etiqueta.toString("hex"), datos.toString("hex")].join(":");
};

const desencriptar = (textoEncriptado) => {
  const [ivHex, etiquetaHex, datosHex] = textoEncriptado.split(":");
  const descifrador = crypto.createDecipheriv(ALGORITMO, clave, Buffer.from(ivHex, "hex"));
  descifrador.setAuthTag(Buffer.from(etiquetaHex, "hex"));
  const datos = Buffer.concat([
    descifrador.update(Buffer.from(datosHex, "hex")),
    descifrador.final(),
  ]);

  return datos.toString("utf8");
};

const hashDocumento = (numero) => {
  return crypto.createHmac("sha256", clave).update(numero).digest("hex");
};

module.exports = { encriptar, desencriptar, hashDocumento };
