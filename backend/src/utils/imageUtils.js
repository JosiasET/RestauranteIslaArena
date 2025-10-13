function processImage(imagen) {
  if (!imagen) return null;
  return Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

function imageToBase64(imagenBuffer) {
  if (!imagenBuffer) return null;
  return `data:image/png;base64,${imagenBuffer.toString("base64")}`;
}

module.exports = { processImage, imageToBase64 };