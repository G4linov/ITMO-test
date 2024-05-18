// logout.test.js
const { Telegraf } = require('telegraf');
const { User } = require('../models');
const bot = require('../testbot');

jest.mock('../models');
jest.mock('telegraf');

describe('/logout command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      from: { id: 123 },
      message: { text: '/logout' },
      reply: jest.fn(),
    };
  });

  it('should logout the user', async () => {
    User.updateOne.mockResolvedValue({});

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(User.updateOne).toHaveBeenCalledWith({ telegramId: 123 }, { isAuthorized: false });
    expect(ctx.reply).toHaveBeenCalledWith('Вы успешно вышли из системы.');
  });

  it('should handle missing user', async () => {
    User.updateOne.mockResolvedValue(null);

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка при выходе из системы.');
  });

  it('should handle database errors', async () => {
    User.updateOne.mockRejectedValue(new Error('Database error'));

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка при выходе из системы.');
  });

  it('should handle unauthorized access', async () => {
    ctx.from.id = undefined; // Simulate an unauthorized user

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Вы не авторизованы. Используйте /auth <ключ>, чтобы авторизоваться.');
  });

  it('should handle already logged out user', async () => {
    User.findOne.mockResolvedValue({ telegramId: 123, isAuthorized: false });

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Вы уже вышли из системы.');
  });
});
