const { Telegraf } = require('telegraf');
const { helpHandler, bot } = require('../newbot');
const mongoose = require('mongoose');
const { User } = require('../models');

jest.mock('telegraf');

describe('/help command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      message: { text: '/help' },
      reply: jest.fn(),
    };
  });

  it('should provide help message', async () => {
    helpHandler(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Список доступных команд'));
  });

  it('should list all commands', async () => {
    helpHandler(ctx);

    const helpMessage = `
      /auth <ключ> - Авторизация
      /register <ФИО> - Регистрация
      /deleteorder <ID> - Удалить заказ
      /addorder <сумма> <комментарий> - Добавить заказ
      /takeorder <ID> - Взять заказ
      /listorders - Показать все доступные заказы
      /myorders - Показать ваши заказы
      /logout - Выйти из системы
      /help - Показать это сообщение
    `;

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining(helpMessage));
  });

  it('should handle unauthorized access', async () => {
    ctx.from = { id: 123 }; // Simulate an unauthorized user

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Вы не авторизованы. Используйте /auth <ключ>, чтобы авторизоваться.'));
  });

  it('should handle missing message text', async () => {
    ctx.message.text = '';

    await bot.handleUpdate({ message: ctx.message });

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Список доступных команд'));
  });

  it('should respond to additional help topics', async () => {
    ctx.message.text = '/help auth';

    await bot.handleUpdate({ message: ctx.message });

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Команда /auth используется для авторизации'));
  });
});
