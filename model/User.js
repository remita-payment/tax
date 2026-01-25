// models/User.js
import mongoose from 'mongoose'
import TwoFactorConfirmation from './Two-Factor-Confirmation';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, uppercase: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['Admin', 'User'], default: 'User' },
    password: { type: String, required: [true, 'Password is required'] },
    image: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);


const User = mongoose.models?.User || mongoose.model('User', userSchema);

export default User;
