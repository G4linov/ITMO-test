// addorder.test.js
const { Telegraf } = require('telegraf');
const { addorderHandler, bot } = require('../newbot'); 
const mongoose = require('mongoose');
const { User } = require('../models');

jest.mock('../models');
jest.mock('telegraf');

describe('/addorder command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      from: { id: 123 },
      message: { text: '/addorder 100 Test order' },
      reply: jest.fn(),
    };
  });

  it('should add a new order', async () => {
    User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 123 });
    Order.prototype.save = jest.fn().mockResolvedValue({});

    await addorderHandler({ message: ctx.message, from: ctx.from });

    expect(Order.prototype.save).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Заказ успешно добавлен'));
  });

  it('should handle missing reward amount or comment', async () => {
    ctx.message.text = '/addorder';

    await addorderHandler({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Пожалуйста, укажите сумму вознаграждения и комментарий для заказа.');
  });

  it('should handle invalid reward amount', async () => {
    ctx.message.text = '/addorder abc Test order';

    await addorderHandler({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Пожалуйста, укажите корректную сумму вознаграждения.');
  });

  it('should handle missing user', async () => {
    User.findOne.mockResolvedValue(null);

    await addorderHandler({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Пользователь не найден.');
  });

  it('should handle database errors', async () => {
    User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 123 });
    Order.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

    await addorderHandler({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка с созданием заказа. Администратору уже оповещен');
  });
});
