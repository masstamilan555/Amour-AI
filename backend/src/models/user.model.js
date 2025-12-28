// models/User.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: { type: String, required: true, default: "User" },
  phone: { type: String, required: true, unique: true },
  phoneVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: () => new Date() },
  adminAccess: { type: Boolean, default: false },
  lastLoginAt: { type: Date },

  // NEW: credits and lightweight order tracking to prevent double-crediting
  credits: { type: Number, default: 4 },
  creditedOrders: { type: [String], default: [] }, // store razorpay_order_id strings
});

// add index to creditedOrders if you expect many entries
// UserSchema.index({ creditedOrders: 1 });

export default mongoose.model("User", UserSchema);
