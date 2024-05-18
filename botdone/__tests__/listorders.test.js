// listorders.test.js
const { Telegraf } = require('telegraf');
const { Order } = require('../models');
const bot = require('../testbot');

jest.mock('../models');
jest.mock('telegraf');

describe('/listorders command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      message: { text: '/listorders' },
      reply: jest.fn(),
    };
  });

  it('should list all available orders', async () => {
    const orders = [
      { orderId: '123', reward: 100, comment: 'Test order 1' },
      { orderId: '456', reward: 200, comment: 'Test order 2' },
    ];

    Order.find.mockResolvedValue(orders);

    await bot.handleUpdate({ message: ctx.message });

    expect(Order.find).toHaveBeenCalledWith({ executorId: null });
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ID: 123'));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ID: 456'));
  });

  it('should handle no available orders', async () => {
    Order.find.mockResolvedValue([]);

    await bot.handleUpdate({ message: ctx.message });

    expect(ctx.reply).toHaveBeenCalledWith('Нет доступных заказов.');
  });

  it('should handle database errors', async () => {
    Order.find.mockRejectedValue(new Error('Database error'));

    await bot.handleUpdate({ message: ctx.message });

    expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка при получении списка заказов.');
  });

  it('should handle unauthorized access', async () => {
    ctx.from = { id: 123 }; // Simulate an unauthorized user

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Вы не авторизованы. Используйте /auth <ключ>, чтобы авторизоваться.');
  });

  it('should list orders with specific filters', async () => {
    ctx.message.text = '/listorders reward>100';

    Order.find.mockResolvedValue([{ orderId: '456', reward: 200, comment: 'High reward order' }]);

    await bot.handleUpdate({ message: ctx.message });

    expect(Order.find).toHaveBeenCalledWith({ reward: { $gt: 100 }, executorId: null });
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ID: 456'));
  });
});
