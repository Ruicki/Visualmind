
import dotenv from 'dotenv';
dotenv.config();
import pool from '../src/config/db.js';


async function checkActiveCampaign() {
    try {
        const query = `
            SELECT *, COALESCE(type, 'campaign') as type
            FROM campaigns 
            WHERE is_active = true 
            AND (start_date IS NULL OR start_date <= NOW()) 
            AND (end_date IS NULL OR end_date >= NOW()) 
            ORDER BY start_date DESC 
            LIMIT 1
        `;
        const result = await pool.query(query);
        console.log('Active Campaign Data:');
        console.log(JSON.stringify(result.rows[0], null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkActiveCampaign();
