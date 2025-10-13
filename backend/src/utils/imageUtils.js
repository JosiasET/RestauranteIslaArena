const processImage = (base64String) => {
  if (!base64String) return null;
  return Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ""), "base64");
};

const formatImageResponse = (rows) => {
  return rows.map(row => {
    if (row.imagen) {
      row.imagen = `data:image/png;base64,${row.imagen.toString("base64")}`;
    }
    return row;
  });
};

module.exports = { processImage, formatImageResponse };