const db = require("../config/bd");

// Obtener todos los platillos
const getAllPlatillos = async (req, res) => {
  try {
    const { data, error } = await db
      .from('Platillos')
      .select('*');

    if (error) throw error;

    const platillos = data.map(platillo => ({
      ...platillo,
      imagen: platillo.imagen ? `data:image/png;base64,${platillo.imagen.toString('base64')}` : null
    }));

    res.json(platillos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear platillo
const createPlatillo = async (req, res) => {
  const { nombre, descripcion, precio, imagen } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({ error: "Nombre y precio son requeridos" });
  }

  try {
    let imagenBuffer = null;
    if (imagen) {
      imagenBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64");
    }

    const { data, error } = await db
      .from('Platillos')
      .insert([{ nombre, descripcion, precio, imagen: imagenBuffer }])
      .select();

    if (error) throw error;

    res.json({
      message: "✅ Platillo guardado",
      data: data[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar platillo
const updatePlatillo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;

    let imagenBuffer = null;
    if (imagen) {
      imagenBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64");
    }

    const updateData = { 
      nombre, 
      descripcion, 
      precio 
    };

    if (imagenBuffer !== null) {
      updateData.imagen = imagenBuffer;
    }

    const { data, error } = await db
      .from('Platillos')
      .update(updateData)
      .eq('id_platillo', id)
      .select();

    if (error) throw error;
    
    res.json({ 
      message: "✅ Platillo actualizado", 
      data: data[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar platillo
const deletePlatillo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await db
      .from('Platillos')
      .delete()
      .eq('id_platillo', id);

    if (error) throw error;
    
    res.json({ message: "✅ Platillo eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Exportar TODAS las funciones
module.exports = {
  getAllPlatillos,
  createPlatillo,
  updatePlatillo,
  deletePlatillo
};