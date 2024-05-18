// models/order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  status: { type: String, default: 'Открыт' },
  orderDate: { type: Date, default: Date.now },
  rewardAmount: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  executorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  comment: { type: String, default: '' },
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
