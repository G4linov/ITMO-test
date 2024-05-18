const { Telegraf } = require('telegraf');
const { helpHandler, bot } = require('../newbot');
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
describe('/help command', () => {
    let ctx;

    beforeEach(() => {
        ctx = {
            message: { text: '/help' },
            reply: jest.fn(),
            from: { id: 123, isAuthorized: true },
        };

        botMock = new Telegraf();
        bot.telegram = botMock.telegram; // Заменяем бот на мокаемый объект
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should provide help message', async () => {
        await helpHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Список доступных команд'));
    });

    it('should list all commands', async () => {
        User.findOne.mockResolvedValue({ id: 123, isAuthorized: true });

        await helpHandler(ctx);

        const helpMessage = 'Список доступных команд:\n/auth [key] - Авторизация\n/register - Регистрация\n/help - Справка\n' +
            '/deleteorder [orderId] - Удаление заказа\n' +
            '/addorder [details] - Добавление заказа\n' +
            '/takeorder [orderId] - Взятие заказа\n' +
            '/openorders - Список открытых заказов\n' +
            '/orders - Список ваших заказов\n'
            ;

        expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining(helpMessage));
    });

    it('should handle unauthorized access', async () => {
        ctx.from = { id: 123 }; // Simulate an unauthorized user

        await helpHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Список доступных команд:\n/auth [key] - Авторизация\n/register - Регистрация\n/help - Справка\n'));
    });
});
