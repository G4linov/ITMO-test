// myorders.test.js
const { Telegraf } = require('telegraf');
const { Order } = require('../models');
const bot = require('../testbot');

jest.mock('../models');
jest.mock('telegraf');

describe('/myorders command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      from: { id: 123 },
      message: { text: '/myorders' },
      reply: jest.fn(),
    };
  });

  it('should list all user orders', async () => {
    const orders = [
      { orderId: '123', reward: 100, comment: 'User order 1' },
      { orderId: '456', reward: 200, comment: 'User order 2' },
    ];

    Order.find.mockResolvedValue(orders);

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(Order.find).toHaveBeenCalledWith({ userId: 'userId' });
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ID: 123'));
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ID: 456'));
  });

  it('should handle no user orders', async () => {
    Order.find.mockResolvedValue([]);

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('У вас нет активных заказов.');
  });

  it('should handle database errors', async () => {
    Order.find.mockRejectedValue(new Error('Database error'));

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка при получении ваших заказов.');
  });

  it('should handle unauthorized access', async () => {
    ctx.from.id = undefined; // Simulate an unauthorized user

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Вы не авторизованы. Используйте /auth <ключ>, чтобы авторизоваться.');
  });

  it('should list orders with specific status', async () => {
    ctx.message.text = '/myorders completed';

    Order.find.mockResolvedValue([{ orderId: '456', reward: 200, comment: 'Completed order', status: 'completed' }]);

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(Order.find).toHaveBeenCalledWith({ userId: 'userId', status: 'completed' });
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ID: 456'));
  });
});
