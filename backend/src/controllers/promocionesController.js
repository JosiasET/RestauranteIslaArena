const db = require("../config/bd");

const promocionesController = {
  getAll: async (req, res) => {
    try {
      const { data, error } = await db
        .from('Promociones')
        .select('*');
      
      if (error) throw error;
      
      const promociones = data.map(item => ({
        ...item,
        imagen: item.imagen ? `data:image/png;base64,${item.imagen.toString('base64')}` : null
      }));
      
      res.json(promociones);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { nombre, descripcion, imagen } = req.body;
      
      if (!nombre) {
        return res.status(400).json({ error: "Nombre es requerido" });
      }

      let imagenBuffer = null;
      if (imagen) {
        imagenBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64");
      }

      const { data, error } = await db
        .from('Promociones')
        .insert([{ nombre, descripcion, imagen: imagenBuffer }])
        .select();

      if (error) throw error;
      
      res.json({ 
        message: "✅ Promoción guardada", 
        data: data[0] 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, imagen } = req.body;

      let imagenBuffer = null;
      if (imagen) {
        imagenBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64");
      }

      const updateData = { nombre, descripcion };
      if (imagenBuffer !== null) updateData.imagen = imagenBuffer;

      const { data, error } = await db
        .from('Promociones')
        .update(updateData)
        .eq('id_promocion', id)
        .select();

      if (error) throw error;
      
      res.json({ 
        message: "✅ Promoción actualizada", 
        data: data[0] 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      
      const { error } = await db
        .from('Promociones')
        .delete()
        .eq('id_promocion', id);

      if (error) throw error;
      
      res.json({ message: "✅ Promoción eliminada" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = promocionesController;