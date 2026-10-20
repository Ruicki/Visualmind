/**
 * @file adminController.js
 * @description Controlador para el dashboard administrativo.
 * Calcula métricas de ventas, stock, pedidos recientes y rendimiento de productos.
 */
import pool from '../src/config/db.js';
import { toCsv } from '../services/csv.js';

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * exportSalesCsv
 * @description (Admin) Ventas cobradas en un rango de fechas (subtotal, envío y total),
 * lista para llevar la contabilidad. GET /api/admin/reports/sales.csv?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export const exportSalesCsv = async (req, res) => {
    const { from, to } = req.query;
    if ((from && !isDate(from)) || (to && !isDate(to))) {
        return res.status(400).json({ error: 'Usa fechas con formato AAAA-MM-DD' });
    }
    try {
        const { rows } = await pool.query(`
            SELECT o.id, o.created_at, COALESCE(o.paid_at, o.created_at) AS paid_at, o.status, o.payment_method,
                   o.subtotal, o.shipping_cost, o.total, o.items, o.shipping_details, u.email
            FROM orders o LEFT JOIN users u ON u.id = o.user_id
            WHERE o.status IN ${PAID_STATUSES}
              AND ($1::date IS NULL OR COALESCE(o.paid_at, o.created_at) >= $1::date)
              AND ($2::date IS NULL OR COALESCE(o.paid_at, o.created_at) < $2::date + INTERVAL '1 day')
            ORDER BY COALESCE(o.paid_at, o.created_at) ASC
        `, [from || null, to || null]);
        const data = rows.map(o => {
            const ship = o.shipping_details || {};
            const items = (o.items || []).map(i => `${i.quantity}x ${i.title}${i.size ? ` (${i.size})` : ''}`).join(' | ');
            return [
                String(o.id).slice(0, 8).toUpperCase(), o.created_at, o.paid_at, o.status, o.payment_method,
                Number(o.subtotal ?? o.total), Number(o.shipping_cost ?? 0), Number(o.total),
                ship.name || '', o.email || ship.email || '', ship.phone || '', ship.city || '', items
            ];
        });
        const csv = toCsv(
            ['Pedido', 'Creado', 'Pagado', 'Estado', 'Método', 'Subtotal', 'Envío', 'Total', 'Cliente', 'Email', 'Teléfono', 'Ciudad', 'Artículos'],
            data
        );
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.set('Content-Disposition', `attachment; filename="ventas-${from || 'inicio'}-a-${to || 'hoy'}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error al exportar ventas:', error);
        res.status(500).json({ error: 'Error al exportar ventas' });
    }
};

/**
 * exportNewsletterCsv
 * @description (Admin) Lista de suscriptores del newsletter.
 */
export const exportNewsletterCsv = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT email, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC');
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.set('Content-Disposition', 'attachment; filename="suscriptores.csv"');
        res.send(toCsv(['Email', 'Fecha'], rows.map(r => [r.email, r.subscribed_at])));
    } catch (error) {
        console.error('Error al exportar suscriptores:', error);
        res.status(500).json({ error: 'Error al exportar suscriptores' });
    }
};

/**
 * getDashboardStats
 * @description Recopila estadísticas clave para la visualización en el panel de control.
 * Ventas = solo pedidos cobrados (paid/shipped/delivered); los 'pending' se reportan
 * aparte como "pendiente de cobro". Ejecuta consultas agregadas para ventas, clientes
 * y alertas de stock bajo (incluyendo variantes).
 */
// Solo cuentan como venta los pedidos cobrados (pago manual confirmado por el admin)
const PAID_STATUSES = "('paid', 'shipped', 'delivered')";

export const getDashboardStats = async (req, res) => {
    try {
        // 1. Ventas cobradas (total histórico) y comparación mes actual vs anterior
        const salesResult = await pool.query(`
            SELECT
                COALESCE(SUM(total), 0) AS total_sales,
                COALESCE(SUM(total) FILTER (WHERE created_at >= date_trunc('month', NOW())), 0) AS this_month,
                COALESCE(SUM(total) FILTER (WHERE created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
                                              AND created_at <  date_trunc('month', NOW())), 0) AS last_month
            FROM orders WHERE status IN ${PAID_STATUSES}
        `);
        const totalSales = parseFloat(salesResult.rows[0].total_sales);
        const salesThisMonth = parseFloat(salesResult.rows[0].this_month);
        const salesLastMonth = parseFloat(salesResult.rows[0].last_month);
        // null cuando no hay mes anterior con ventas (no se inventa un porcentaje)
        const growth = salesLastMonth > 0
            ? Math.round(((salesThisMonth - salesLastMonth) / salesLastMonth) * 1000) / 10
            : null;

        // 1b. Pendiente de cobro: pedidos registrados que aún no se han pagado
        const pendingResult = await pool.query(`
            SELECT COUNT(*) AS count, COALESCE(SUM(total), 0) AS amount
            FROM orders WHERE status = 'pending'
        `);
        const pendingPayment = {
            count: parseInt(pendingResult.rows[0].count),
            amount: parseFloat(pendingResult.rows[0].amount)
        };

        // 2. Total de Pedidos (sin cancelados)
        const ordersCountResult = await pool.query("SELECT COUNT(*) as total_orders FROM orders WHERE status != 'cancelled'");
        const totalOrders = parseInt(ordersCountResult.rows[0].total_orders || 0);

        // 3. Total de Clientes
        const usersCountResult = await pool.query("SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer'");
        const totalCustomers = parseInt(usersCountResult.rows[0].total_customers || 0);

        const subscribersResult = await pool.query('SELECT COUNT(*)::int AS count FROM newsletter_subscribers');
        const newsletterSubscribers = subscribersResult.rows[0].count;

        // 4. Ventas cobradas de los últimos 7 días (para el gráfico)
        const weeklySalesResult = await pool.query(`
            SELECT 
                TO_CHAR(created_at, 'DD/MM') as date,
                CAST(SUM(total) AS FLOAT) as amount
            FROM orders 
            WHERE created_at > NOW() - INTERVAL '7 days' AND status IN ${PAID_STATUSES}
            GROUP BY TO_CHAR(created_at, 'DD/MM')
            ORDER BY MIN(created_at) ASC
        `);

        // 5. Productos más vendidos (solo pedidos cobrados)
        const topSellersResult = await pool.query(`
            SELECT p.title, COUNT(oi.id) as sales_count, SUM(oi.quantity) as items_sold
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON o.id = oi.order_id AND o.status IN ${PAID_STATUSES}
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
                salesThisMonth,
                growth,
                pendingPayment,
                totalOrders,
                totalCustomers,
                newsletterSubscribers
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
