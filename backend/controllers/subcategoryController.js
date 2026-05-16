import pool from '../src/config/db.js';

export const getSubcategories = async (req, res) => {
  const { category_id } = req.query;
  try {
    let query, params;
    if (category_id) {
      query = 'SELECT * FROM subcategories WHERE category_id = $1 ORDER BY name ASC';
      params = [category_id];
    } else {
      query = 'SELECT * FROM subcategories ORDER BY name ASC';
      params = [];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getSubcategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM subcategories WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategoría no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener subcategoría:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const getSubcategoryProducts = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.*,
             COALESCE(
                 (SELECT json_agg(pv.*) FROM product_variants pv WHERE pv.product_id = p.id), '[]'
             ) as variants
      FROM products p
      WHERE p.subcategory_id = $1
      ORDER BY p.created_at DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos de subcategoría:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

export const createSubcategory = async (req, res) => {
  const { name, slug, category_id, image_url, description } = req.body;
  if (!name || !slug || !category_id) {
    return res.status(400).json({ error: 'name, slug y category_id son requeridos' });
  }
  try {
    const result = await pool.query(`
      INSERT INTO subcategories (name, slug, category_id, image_url, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, slug, category_id, image_url || null, description || null]);
    res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear subcategoría:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe una subcategoría con ese slug en esta categoría' });
        }
        res.status(500).json({ error: 'Error al crear subcategoría: ' + error.message });
    }
};

export const updateSubcategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, category_id, image_url, description } = req.body;
  try {
    const result = await pool.query(`
      UPDATE subcategories
      SET name = COALESCE($1, name),
          slug = COALESCE($2, slug),
          category_id = COALESCE($3, category_id),
          image_url = COALESCE($4, image_url),
          description = COALESCE($5, description)
      WHERE id = $6
      RETURNING *
    `, [name, slug, category_id, image_url, description, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategoría no encontrada' });
    }
    res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar subcategoría:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe otra subcategoría con ese slug en esta categoría' });
        }
        res.status(500).json({ error: 'Error al actualizar subcategoría: ' + error.message });
    }
};

export const deleteSubcategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = $1', [id]);
    const result = await pool.query('DELETE FROM subcategories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategoría no encontrada' });
    }
    res.json({ message: 'Subcategoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar subcategoría:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
