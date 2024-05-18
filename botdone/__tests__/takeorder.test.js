// takeorder.test.js
const { Telegraf } = require('telegraf');
const { User, Order } = require('../models');
const bot = require('../testbot');

jest.mock('../models');
jest.mock('telegraf');

describe('/takeorder command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      from: { id: 123 },
      message: { text: '/takeorder 123456' },
      reply: jest.fn(),
    };
  });

  it('should assign an order to the user', async () => {
    const user = { _id: 'userId', telegramId: 123, fullName: 'John Doe' };
    const order = { orderId: '123456', userId: 'creatorId', executorId: null };

    User.findOne.mockResolvedValue(user);
    Order.findOne.mockResolvedValue(order);
    Order.prototype.save = jest.fn().mockResolvedValue(order);

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(Order.prototype.save).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Вы назначены исполнителем заказа с ID: 123456'));
  });

  it('should handle order with existing executor', async () => {
    const user = { _id: 'userId', telegramId: 123 };
    const order = { orderId: '123456', userId: 'creatorId', executorId: 'anotherUserId' };

    User.findOne.mockResolvedValue(user);
    Order.findOne.mockResolvedValue(order);

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('У этого заказа уже есть исполнитель.');
  });

  it('should handle missing order ID', async () => {
    ctx.message.text = '/takeorder';

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Пожалуйста, укажите ID заказа.');
  });

  it('should handle non-existent order', async () => {
    User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 123 });
    Order.findOne.mockResolvedValue(null);

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Заказ не найден или он уже закрыт.');
  });

  it('should handle database errors', async () => {
    User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 123 });
    Order.findOne.mockRejectedValue(new Error('Database error'));

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка с назначение исполнителя. Администратор уже оповещен');
  });
});
