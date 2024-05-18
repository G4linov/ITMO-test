// register.test.js
const { Telegraf } = require('telegraf');
const { User } = require('../models');
const bot = require('../testbot');

jest.mock('../models');
jest.mock('telegraf');

describe('/register command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      from: { id: 123 },
      message: { text: '/register John Doe' },
      reply: jest.fn(),
    };
  });

  it('should register a new user', async () => {
    User.findOne.mockResolvedValue(null);
    User.prototype.save = jest.fn().mockResolvedValue({});

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(User.findOne).toHaveBeenCalledWith({ telegramId: 123 });
    expect(User.prototype.save).toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Регистрация успешна'));
  });

  it('should handle existing user', async () => {
    User.findOne.mockResolvedValue({ telegramId: 123 });

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Вы уже зарегистрированы.');
  });

  it('should handle missing Telegram ID', async () => {
    ctx.from.id = undefined;

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Не удалось получить ваш Telegram ID.');
  });

  it('should handle database errors', async () => {
    User.findOne.mockRejectedValue(new Error('Database error'));

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка с регистрацией. Администратор уже оповещен');
  });

  it('should handle save errors', async () => {
    User.findOne.mockResolvedValue(null);
    User.prototype.save = jest.fn().mockRejectedValue(new Error('Save error'));

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка с регистрацией. Администратор уже оповещен');
  });
});
