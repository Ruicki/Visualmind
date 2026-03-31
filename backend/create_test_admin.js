import pool from './src/config/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const createAdmin = async () => {
    const email = 'testadmin@visualmind.com';
    const password = 'PasswordAdmin123!';
    const full_name = 'Test Administrator';
    const role = 'admin';

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role',
            [email, hashedPassword, full_name, role]
        );

        console.log('✅ Test admin created/updated successfully');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test admin:', error);
        process.exit(1);
    }
};

createAdmin();
