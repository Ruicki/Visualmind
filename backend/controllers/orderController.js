import pool from '../src/config/db.js';

export const createOrder = async (req, res) => {
  const { total, items, shippingDetails } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'El pedido debe tener al menos un artículo' });
  }
  if (!total || isNaN(total) || total <= 0) {
    return res.status(400).json({ message: 'Total inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar stock suficiente para todos los ítems
    for (const item of items) {
      const result = await client.query('SELECT stock FROM products WHERE id = $1', [item.product_id]);
      if (!result.rows[0] || result.rows[0].stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Stock insuficiente para: ${item.title}` });
      }
    }

    // 2. Crear la orden
    const newOrder = await client.query(
      'INSERT INTO orders (user_id, total, items, status, shipping_details) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, total, JSON.stringify(items), 'pending', JSON.stringify(shippingDetails || {})]
    );

    // 3. Decrementar stock
    for (const item of items) {
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(newOrder.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear orden:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req, res) => {
  console.log('--- GET MY ORDERS ---');
  console.log('User from req:', req.user);
  const userId = req.user?.id;

  if (!userId) {
    console.error('UserId missing in request!');
    return res.status(401).json({ message: 'No autorizado, falta ID de usuario' });
  }

  try {
    console.log('Querying orders for userId:', userId);
    const orders = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    console.log('Orders found:', orders.rows.length);
    res.json(orders.rows);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ message: 'Error en el servidor', detail: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await pool.query(
      'SELECT o.*, u.email as user_email FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
    );
    res.json(orders.rows);
  } catch (error) {
    console.error('Error al obtener todas las órdenes:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If cancelling, restore stock for each item
    if (status === 'cancelled') {
      const orderResult = await client.query('SELECT items FROM orders WHERE id = $1', [id]);
      if (orderResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Orden no encontrada' });
      }
      const items = JSON.parse(orderResult.rows[0].items);
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock = stock + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    const updatedOrder = await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (updatedOrder.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    await client.query('COMMIT');
    res.json(updatedOrder.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  } finally {
    client.release();
  }
};
