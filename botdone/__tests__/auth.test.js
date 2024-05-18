const { Telegraf } = require('telegraf');
const { authHandler, bot } = require('../newbot');
const mongoose = require('mongoose');
const { User } = require('../models');

jest.mock('../models');
jest.mock('telegraf', () => ({
    Telegraf: jest.fn().mockImplementation(() => ({
        telegram: {
            sendMessage: jest.fn()
        },
        command: jest.fn(),
        on: jest.fn(),
        launch: jest.fn()
    }))
}));

describe('/auth command', () => {
    let ctx;
    let botMock;

    beforeEach(() => {
        ctx = {
            message: { text: '/auth somekey' },
            reply: jest.fn(),
            from: { id: 123 },
        };

        botMock = new Telegraf();
        bot.telegram = botMock.telegram; // Заменяем бот на мокаемый объект
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should authorize the user with correct authKey', async () => {
        User.findOne.mockResolvedValue({ telegramId: 123, authKey: 'somekey' });
        User.updateOne.mockResolvedValue({});

        await authHandler(ctx); // Вызов с контекстом

        expect(User.findOne).toHaveBeenCalledWith({ telegramId: 123 });
        expect(User.updateOne).toHaveBeenCalledWith({ telegramId: 123 }, { isAuthorized: true });
        expect(ctx.reply).toHaveBeenCalledWith('Вы успешно авторизованы! Теперь вам доступны дополнительные команды.');
    });

    it('should fail with incorrect authKey', async () => {
        User.findOne.mockResolvedValue({ telegramId: 123, authKey: 'wrongkey' });

        await authHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Неверный ключ авторизации.');
    });

    it('should handle missing user', async () => {
        User.findOne.mockResolvedValue(null);

        await authHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Неверный ключ авторизации.');
    });

    it('should handle missing Telegram ID', async () => {
        ctx.from.id = undefined;

        await authHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Не удалось получить ваш Telegram ID.');
    });

    it('should handle database errors', async () => {
        User.findOne.mockRejectedValue(new Error('Database error'));

        await authHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка. Администратор уже оповещен');
        expect(bot.telegram.sendMessage).toHaveBeenCalledWith(process.env.ADMIN_TELEGRAM_ID, expect.any(String));
    });
});
