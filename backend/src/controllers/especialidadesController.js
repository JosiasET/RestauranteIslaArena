const db = require("../config/database");

const especialidadesController = {
  getAll: async (req, res) => {
    try {
      const { data, error } = await db
        .from('Especialidades_mar')
        .select('*');
      
      if (error) throw error;
      
      const especialidades = data.map(item => ({
        ...item,
        imagen: item.imagen ? `data:image/png;base64,${item.imagen.toString('base64')}` : null
      }));
      
      res.json(especialidades);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { nombre, descripcion, precio, imagen } = req.body;
      
      if (!nombre || !precio) {
        return res.status(400).json({ error: "Nombre y precio son requeridos" });
      }

      let imagenBuffer = null;
      if (imagen) {
        imagenBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64");
      }

      const { data, error } = await db
        .from('Especialidades_mar')
        .insert([{ nombre, descripcion, precio, imagen: imagenBuffer }])
        .select();

      if (error) throw error;
      
      res.json({ 
        message: "✅ Especialidad guardada", 
        data: data[0] 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, imagen } = req.body;

      let imagenBuffer = null;
      if (imagen) {
        imagenBuffer = Buffer.from(imagen.replace(/^data:image\/\w+;base64,/, ""), "base64");
      }

      const updateData = { nombre, descripcion, precio };
      if (imagenBuffer !== null) updateData.imagen = imagenBuffer;

      const { data, error } = await db
        .from('Especialidades_mar')
        .update(updateData)
        .eq('id_especialidad', id)
        .select();

      if (error) throw error;
      
      res.json({ 
        message: "✅ Especialidad actualizada", 
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
        .from('Especialidades_mar')
        .delete()
        .eq('id_especialidad', id);

      if (error) throw error;
      
      res.json({ message: "✅ Especialidad eliminada" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = especialidadesController;