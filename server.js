import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Order } from './src/models/Order.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(dirname));

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const isValidOrder = body => body && /^OT-\d+$/.test(body.id || '') && body.name && body.email && Array.isArray(body.items);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.get('/api/orders', asyncRoute(async (_req, res) => {
  const orders = await Order.find().sort({ date: -1, createdAt: -1 }).lean();
  res.json(orders.map(({ _id, __v, ...order }) => order));
}));

app.get('/api/orders/:id', asyncRoute(async (req, res) => {
  const order = await Order.findOne({ id: req.params.id }).lean();
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  const { _id, __v, ...record } = order;
  res.json(record);
}));

app.post('/api/orders', asyncRoute(async (req, res) => {
  if (!isValidOrder(req.body)) return res.status(400).json({ error: 'Order requires an OT-#### id, customer details, and item list.' });
  if (await Order.exists({ id: req.body.id })) return res.status(409).json({ error: 'An order with that id already exists.' });
  const order = await Order.create(req.body);
  res.status(201).json(order.toJSON());
}));

// Keep the fixed sync path before /:id so "sync" is not treated as an order id.
app.put('/api/orders/sync', asyncRoute(async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length > 1000 || !req.body.every(isValidOrder)) {
    return res.status(400).json({ error: 'Expected an array of at most 1,000 valid order records.' });
  }
  const ids = req.body.map(order => order.id);
  if (new Set(ids).size !== ids.length) return res.status(400).json({ error: 'Order ids must be unique.' });
  const operations = req.body.map(order => ({ updateOne: { filter: { id: order.id }, update: { $set: order }, upsert: true } }));
  if (operations.length) await Order.bulkWrite(operations, { ordered: true });
  res.json({ saved: operations.length });
}));

app.put('/api/orders/:id', asyncRoute(async (req, res) => {
  if (!isValidOrder({ ...req.body, id: req.params.id })) return res.status(400).json({ error: 'Invalid order record.' });
  const order = await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true });
  res.json(order.toJSON());
}));

app.delete('/api/orders/:id', asyncRoute(async (req, res) => {
  const deleted = await Order.findOneAndDelete({ id: req.params.id });
  if (!deleted) return res.status(404).json({ error: 'Order not found.' });
  res.status(204).end();
}));

app.get('/api/metrics', asyncRoute(async (_req, res) => {
  const [metrics] = await Order.aggregate([{ $group: {
    _id: null,
    totalOrders: { $sum: 1 },
    openOrders: { $sum: { $cond: [{ $not: [{ $in: ['$status', ['Delivered', 'Refunded']] }] }, 1, 0] } },
    delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
    returnsAwaitingReview: { $sum: { $cond: [{ $eq: ['$status', 'Return requested'] }, 1, 0] } },
    revenueProcessed: { $sum: { $cond: [{ $eq: ['$payment', 'Paid'] }, '$amount', 0] } }
  } }]);
  const { _id, ...result } = metrics || { totalOrders: 0, openOrders: 0, delivered: 0, returnsAwaitingReview: 0, revenueProcessed: 0 };
  res.json(result);
}));

app.use('/api', (err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') return res.status(400).json({ error: err.message });
  res.status(500).json({ error: 'The server could not complete that request.' });
});

async function start() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required. Copy .env.example to .env and set your MongoDB connection string.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  app.listen(port, () => console.log(`Fulcrum OTFS listening at http://localhost:${port}`));
}

start().catch(error => {
  console.error(`Startup failed: ${error.message}`);
  process.exitCode = 1;
});
