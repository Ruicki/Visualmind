/**
 * @file orderController.js
 * @description Controlador para la gestión de pedidos y transacciones de compra.
 * Maneja la creación de órdenes, seguimiento de historial y actualización de estados.
 */

import pool from '../src/config/db.js';

/**
 * createOrder
 * @description Registra una nueva orden de compra en el sistema.
 * Utiliza transacciones SQL para asegurar que la orden y la actualización de stock
 * (actualmente en testing) sean atómicas.
 */
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

    /**
     * @note Verificación de stock deshabilitada temporalmente para testing.
     * En producción, se debe iterar sobre 'items' y verificar disponibilidad.
     */
    
    // Inserción de la orden. Se almacena 'items' y 'shipping_details' como JSONB para flexibilidad.
    const newOrder = await client.query(
      'INSERT INTO orders (user_id, total, items, status, shipping_details) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, total, JSON.stringify(items), 'pending', JSON.stringify(shippingDetails || {})]
    );

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

/**
 * getMyOrders
 * @description Recupera el historial de pedidos del usuario autenticado.
 */
export const getMyOrders = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'No autorizado, falta ID de usuario' });
  }

  try {
    const orders = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(orders.rows);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ message: 'Error en el servidor', detail: error.message });
  }
};

/**
 * getAllOrders
 * @description (Admin Only) Obtiene todas las órdenes del sistema con información del cliente.
 */
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

/**
 * updateOrderStatus
 * @description (Admin Only) Actualiza el estado de una orden.
 * Implementa lógica de restauración de stock si el pedido se marca como 'cancelled'.
 */
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

    // Restauración de stock en caso de cancelación
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

