import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://user:pass@cluster.mongodb.net/test');
    console.log('Connected to MongoDB');

    const User = (await import('./src/models/User.js')).default;
    const { ROLES } = (await import('./src/constants/roles.constants.js'));

    const adminEmail = 'admin@maazaprintwala.com';
    const adminPassword = 'MaazaAdmin!Secure2026';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.password = adminPassword;
      existingAdmin.role = ROLES.ADMIN;
      await existingAdmin.save();
    } else {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: ROLES.ADMIN,
      });
      console.log('Admin user created successfully.');
    }

    console.log(`\n======================================`);
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Admin Password: ${adminPassword}`);
    console.log(`======================================\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
