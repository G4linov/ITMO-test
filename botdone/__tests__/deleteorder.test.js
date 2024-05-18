const { Telegraf } = require('telegraf');
const { deleteHandler, bot } = require('../newbot');
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

describe('/deleteorder command', () => {
    let ctx;
    let botMock;

    beforeEach(() => {
        ctx = {
            from: { id: 123 },
            message: { text: '/deleteorder 123456' },
            reply: jest.fn(),
        };

        botMock = new Telegraf();
        bot.telegram = botMock.telegram; // Заменяем бот на мокаемый объект
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should delete an order if user is the creator', async () => {
        User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 123 });
        Order.findOne.mockResolvedValue({ orderId: '123456', userId: 'userId' });
        Order.findOneAndDelete.mockResolvedValue({ orderId: '123456', userId: 'userId' });

        await deleteHandler(ctx);

        expect(Order.findOneAndDelete).toHaveBeenCalledWith({ orderId: '123456' });
        expect(ctx.reply).toHaveBeenCalledWith('Заказ с ID 123456 успешно удален.');
    });

    it('should fail if user is not the creator', async () => {
        User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 1234 });
        Order.findOne.mockResolvedValue({ orderId: '123456', _id: 'Otheruser' });
        Order.findOneAndDelete.mockResolvedValue(null);

        await deleteHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Вы не являетесь создателем заказа ID: 123456');
    });

    it('should handle missing order ID', async () => {
        ctx.message.text = '/deleteorder';

        await deleteHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Пожалуйста, укажите ID заказа.');
    });

    it('should handle non-existent order', async () => {
        User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 123 });
        Order.findOne.mockResolvedValue(null);

        await deleteHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Заказ не найден или он уже закрыт.');
    });

    it('should handle database errors', async () => {
        User.findOne.mockResolvedValue({ _id: 'userId', telegramId: 123 });
        Order.findOne.mockResolvedValue({ orderId: '123456', userId: 'userId' });
        Order.findOneAndDelete.mockRejectedValue(new Error('Database error'));

        await deleteHandler(ctx);

        expect(ctx.reply).toHaveBeenCalledWith('Произошла ошибка. Администратор уже оповещен');
        expect(bot.telegram.sendMessage).toHaveBeenCalledWith(process.env.ADMIN_TELEGRAM_ID, expect.any(String));
    });
});
