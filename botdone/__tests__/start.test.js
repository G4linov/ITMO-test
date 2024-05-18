// start.test.js
const { Telegraf } = require('telegraf');
const bot = require('../testbot');

jest.mock('telegraf');

describe('/start command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      message: { text: '/start' },
      reply: jest.fn(),
    };
  });

  it('should provide welcome message', async () => {
    await bot.handleUpdate({ message: ctx.message });

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Добро пожаловать!'));
  });

  it('should list all commands', async () => {
    await bot.handleUpdate({ message: ctx.message });

    const welcomeMessage = `
      Добро пожаловать! Вот список доступных команд:
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

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining(welcomeMessage));
  });

  it('should handle unauthorized access', async () => {
    ctx.from = { id: 123 }; // Simulate an unauthorized user

    await bot.handleUpdate({ message: ctx.message, from: ctx.from });

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Вы не авторизованы. Используйте /auth <ключ>, чтобы авторизоваться.'));
  });

  it('should handle missing message text', async () => {
    ctx.message.text = '';

    await bot.handleUpdate({ message: ctx.message });

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Добро пожаловать!'));
  });

  it('should respond to additional start arguments', async () => {
    ctx.message.text = '/start info';

    await bot.handleUpdate({ message: ctx.message });

    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Вы используете бот для управления заказами.'));
  });
});
