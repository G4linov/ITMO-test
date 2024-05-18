const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const { User, Order } = require('./models');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Подключение к базе данных
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect('mongodb://localhost:27017/telegrambot', { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error(err));
}

// Обработчики ошибок
function handleErrorReg(ctx, user, error) {
    const userLink = `tg://user?id=${user}`;
    ctx.reply(`У пользователя возникла ошибка: <a href="${userLink}">Чат с пользователем</a>`, { parse_mode: "HTML" });
    const errorMessage = error instanceof Error ? error.message : error.toString();
    bot.telegram.sendMessage(process.env.ADMIN_TELEGRAM_ID, `Код ошибки:\n${errorMessage}`);
}

function handleError(ctx, error) {
    ctx.reply('Произошла ошибка. Администратор уже оповещен');
    const errorMessage = error instanceof Error ? error.message : error.toString();
    bot.telegram.sendMessage(process.env.ADMIN_TELEGRAM_ID, `Код ошибки:\n${errorMessage}`);
}

// Вспомогательные функции
function ctxCorrect(ctx) {
    return ctx && ctx.message && ctx.message.text && ctx.from && ctx.from.id;
}

async function findUser(ctx) {
    try {
        return await User.findOne({ telegramId: ctx.from.id });
    } catch (error) {
        handleError(ctx, error);
    }
}

async function findOrder(ctx, orderId) {
    try {
        return await Order.findById(orderId);
    } catch (error) {
        handleError(ctx, error);
    }
}

async function findOwner(ctx, orderId) {
    try {
        const order = await Order.findById(orderId);
        return order && order.createdBy.toString() === ctx.from.id.toString();
    } catch (error) {
        handleError(ctx, error);
    }
}

// Обработчики команд
async function authHandler(ctx) {
    if (ctxCorrect(ctx)) {
        const authKey = ctx.message.text.split(' ')[1];
        try {
            const user = await User.findOne({ telegramId: ctx.from.id });
            if (user && user.authKey === authKey) {
                await User.updateOne({ telegramId: ctx.from.id }, { isAuthorized: true });
                ctx.reply('Вы успешно авторизованы! Теперь вам доступны дополнительные команды.');
            } else {
                ctx.reply('Неверный ключ авторизации.');
            }
        } catch (error) {
            handleError(ctx, error);
        }
    } else {
        ctx.reply('Не удалось получить ваш Telegram ID.');
    }
}

async function registerHandler(ctx) {
    if (ctxCorrect(ctx)) {
        const fullName = ctx.message.text.split(' ').slice(1).join(' ');
        try {
            const existingUser = await User.findOne({ telegramId: ctx.from.id });
            if (existingUser) {
                return ctx.reply('Вы уже зарегистрированы.');
            } else {
                const authKey = Math.random().toString(36).substring(7); // Генерация простого ключа для примера
                const newUser = new User({
                    telegramId: ctx.from.id,
                    fullName: fullName,
                    authKey: authKey,
                });
                await newUser.save();
                ctx.reply(`Регистрация успешна, ${fullName}! Ваш ключ авторизации: ${authKey}`);
            }
        } catch (error) {
            handleErrorReg(ctx, ctx.from.id, error);
        }
    } else {
        ctx.reply('Не удалось получить ваш Telegram ID.');
    }
}

async function deleteHandler(ctx) {
    if (ctxCorrect(ctx)) {
        const user = await User.findOne({ telegramId: ctx.from.id });
        const orderId = ctx.message.text.split(' ')[1];

        if (!orderId) {
            return ctx.reply('Пожалуйста, укажите ID заказа.');
        }

        const order = await Order.findOne({ orderId: orderId });
        if (!order) {
            return ctx.reply('Заказ не найден или он уже закрыт.');
        }

        try {
            const deletedOrder = await Order.findOneAndDelete({ orderId: orderId , userId: user._id });
            if (!deletedOrder) {
                return ctx.reply(`Вы не являетесь создателем заказа ID: ${orderId}`)
            } else {
                return ctx.reply(`Заказ с ID ${orderId} успешно удален.`);
            }
        } catch (error) {
            handleError(user, error);
        }

    } else {
        ctx.reply('Не удалось получить ваш Telegram ID.');
    }
}

async function addorderHandler(ctx) {
    if (ctxCorrect(ctx)) {
        const user = await User.findOne({ telegramId: ctx.from.id });

        const orderData = ctx.message.text.split(' ').slice(1);
        if (orderData.length < 2) {
            return ctx.reply('Пожалуйста, укажите сумму вознаграждения и комментарий для заказа.');
        }

        const rewardAmount = parseFloat(orderData[0]);
        const comment = orderData.slice(1).join(' ');

        if (isNaN(rewardAmount) || rewardAmount <= 0) {
            return ctx.reply('Пожалуйста, укажите корректную сумму вознаграждения.');
        }

        const orderId = Math.random().toString(36).substr(2, 9); // Генерация уникального ID заказа
        const newOrder = new Order({
            orderId: orderId,
            rewardAmount: rewardAmount,
            userId: user._id,
            comment: comment,
        });

        try {
            await newOrder.save();
            ctx.reply(`Заказ успешно добавлен.`);
        } catch (error) {
            handleError(user, error);
        }
    } else {
        ctx.reply('Не удалось получить ваш Telegram ID.');
    }
}

async function takeorderHandler(ctx) {
    if (ctxCorrect(ctx)) {
        const orderId = ctx.message.text.split(' ')[1];
        try {
            const order = await findOrder(ctx, orderId);
            if (order && !order.takenBy) {
                order.takenBy = ctx.from.id;
                await order.save();
                ctx.reply('Вы успешно взяли заказ.');
            } else {
                ctx.reply('Этот заказ уже взят.');
            }
        } catch (error) {
            handleError(ctx, error);
        }
    } else {
        ctx.reply('Не удалось получить ваш Telegram ID.');
    }
}

async function openordersHandler(ctx) {
    if (ctxCorrect(ctx)) {
        try {
            const orders = await Order.find({ takenBy: null });
            if (orders.length > 0) {
                ctx.reply('Список открытых заказов:\n' + orders.map(order => `ID: ${order._id}, Details: ${order.details}`).join('\n'));
            } else {
                ctx.reply('Нет открытых заказов.');
            }
        } catch (error) {
            handleError(ctx, error);
        }
    } else {
        ctx.reply('Не удалось получить ваш Telegram ID.');
    }
}

async function ordersHandler(ctx) {
    if (ctxCorrect(ctx)) {
        try {
            const orders = await Order.find({ createdBy: ctx.from.id });
            if (orders.length > 0) {
                ctx.reply('Список ваших заказов:\n' + orders.map(order => `ID: ${order._id}, Details: ${order.details}`).join('\n'));
            } else {
                ctx.reply('У вас нет заказов.');
            }
        } catch (error) {
            handleError(ctx, error);
        }
    } else {
        ctx.reply('Не удалось получить ваш Telegram ID.');
    }
}

function helpHandler(ctx) {
    ctx.reply('Список доступных команд:\n' +
        '/auth [key] - Авторизация\n' +
        '/register - Регистрация\n' +
        '/deleteorder [orderId] - Удаление заказа\n' +
        '/addorder [details] - Добавление заказа\n' +
        '/takeorder [orderId] - Взятие заказа\n' +
        '/openorders - Список открытых заказов\n' +
        '/orders - Список ваших заказов\n' +
        '/help - Справка');
}

// Регистрация команд
bot.command('auth', authHandler);
bot.command('register', registerHandler);
bot.command('deleteorder', deleteHandler);
bot.command('addorder', addorderHandler);
bot.command('takeorder', takeorderHandler);
bot.command('openorders', openordersHandler);
bot.command('orders', ordersHandler);
bot.command('help', helpHandler);

// Фallback для неизвестных команд
bot.on('text', (ctx) => {
    ctx.reply('Неизвестная команда. Используйте /help для списка доступных команд.');
});

// Запуск бота
if (process.env.NODE_ENV !== 'test') {
    bot.launch();
    console.log('Bot started');
}

module.exports = { bot, authHandler, registerHandler, deleteHandler, addorderHandler, takeorderHandler, openordersHandler, ordersHandler, helpHandler }; // Экспорт всех обработчиков
