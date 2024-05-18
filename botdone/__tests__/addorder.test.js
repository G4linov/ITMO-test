const { Telegraf } = require('telegraf');
const { addorderHandler, bot } = require('../newbot');
const mongoose = require('mongoose');
const { Order, User } = require('../models');

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

describe('/addorder command', () => {
    let ctx;
    let botMock;

    beforeEach(() => {
        ctx = {
            message: { text: '/addorder 100 Test order' },
            reply: jest.fn(),
            from: { id: 123 },
        };

        botMock = new Telegraf();
        bot.telegram = botMock.telegram; // Заменяем бот на мокаемый объект
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should add a new order', async () => {
        User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 123 });
        Order.prototype.save = jest.fn().mockResolvedValue({});

        await addorderHandler(ctx);

        expect(Order.prototype.save).toHaveBeenCalled();
        expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Заказ успешно добавлен'));
    });

    it('should handle missing reward amount or comment', async () => {
        ctx.message.text = '/addorder';

        await addorderHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Пожалуйста, укажите сумму вознаграждения и комментарий для заказа.');
    });

    it('should handle invalid reward amount', async () => {
        ctx.message.text = '/addorder abc Test order';

        await addorderHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Пожалуйста, укажите корректную сумму вознаграждения.');
    });

    it('should handle missing Telegram ID', async () => {
        ctx.from.id = undefined;

        await addorderHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Не удалось получить ваш Telegram ID.');
    });

    it('should handle database errors', async () => {
        Order.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

        await addorderHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка. Администратор уже оповещен');
        expect(bot.telegram.sendMessage).toHaveBeenCalledWith(process.env.ADMIN_TELEGRAM_ID, expect.any(String));
    });
});