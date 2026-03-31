import pool from '../src/config/db.js';

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Total de Ventas (suma de totales de órdenes)
        const salesResult = await pool.query("SELECT SUM(total) as total_sales FROM orders WHERE status != 'cancelled'");
        const totalSales = parseFloat(salesResult.rows[0].total_sales || 0);

        // 2. Total de Pedidos
        const ordersCountResult = await pool.query("SELECT COUNT(*) as total_orders FROM orders");
        const totalOrders = parseInt(ordersCountResult.rows[0].total_orders || 0);

        // 3. Total de Clientes
        const usersCountResult = await pool.query("SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer'");
        const totalCustomers = parseInt(usersCountResult.rows[0].total_customers || 0);

        // 4. Ventas por semana (para el gráfico)
        const weeklySalesResult = await pool.query(`
            SELECT 
                TO_CHAR(created_at, 'DD/MM') as date,
                CAST(SUM(total) AS FLOAT) as amount
            FROM orders 
            WHERE created_at > NOW() - INTERVAL '7 days' AND status != 'cancelled'
            GROUP BY TO_CHAR(created_at, 'DD/MM')
            ORDER BY MIN(created_at) ASC
        `);

        // 5. Productos más vendidos
        const topSellersResult = await pool.query(`
            SELECT p.title, COUNT(oi.id) as sales_count, SUM(oi.quantity) as items_sold
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.title
            ORDER BY items_sold DESC
            LIMIT 5
        `);

        // 6. Últimos pedidos (con email del usuario)
        const recentOrdersResult = await pool.query(`
            SELECT o.*, u.email as customer_email, u.full_name as customer_name
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC 
            LIMIT 5
        `);

        // 7. Productos con stock bajo (Mejorado para variantes)
        const lowStockResult = await pool.query(`
            SELECT id, title, stock, image_url, 'Main' as type
            FROM products 
            WHERE stock < 10
            UNION ALL
            SELECT p.id, p.title || ' (' || pv.size || '/' || pv.color || ')', pv.stock, p.image_url, 'Variant' as type
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.id
            WHERE pv.stock < 10
            LIMIT 10
        `);

        res.json({
            stats: {
                totalSales,
                totalOrders,
                totalCustomers,
                growth: '+12.5%'
            },
            weeklySales: weeklySalesResult.rows,
            topSellers: topSellersResult.rows,
            recentOrders: recentOrdersResult.rows,
            lowStock: lowStockResult.rows
        });
    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error del servidor al obtener estadísticas' });
    }
};
