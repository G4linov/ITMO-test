require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const { User } = require('./models');
const { Order } = require('./models');

if (!mongoose.connection.readyState) {
    mongoose.connect('mongodb://localhost:27017/telegrambot', { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('MongoDB connected')

            const adminTelegramId = 395143060;

            const bot = new Telegraf(process.env.BOT_TOKEN);

            function handleErrorReg(user, error) {
                const userLink = `tg://user?id=${user}`;
                ctx.reply(`У пользователя возникла ошибка: <a href="${userLink}">Чат с пользователем</a>`, { parse_mode: "HTML" });
                const errorMessage = error instanceof Error ? error.message : error.toString();
                bot.sendMessage(adminTelegramId, `Код ошибки:\n${errorMessage}`);
            }

            function handleError(user, error) {
                const userLink = `tg://user?id=${user.telegramId}`;
                ctx.reply(`У пользователя возникла ошибка: <a href="${userLink}">Чат с пользователем</a>`, { parse_mode: "HTML" });
                const errorMessage = error instanceof Error ? error.message : error.toString();
                bot.sendMessage(adminTelegramId, `Код ошибки:\n${errorMessage}`);
            }

            function ctxCorrect(ctx) {
                if (!ctx.from || !ctx.from.id) {
                    return false;
                } else {
                    return true;
                }
            }

            async function authHandler(ctx) {
                if (ctxCorrect(ctx)) {
                    const authKey = ctx.message.text.split(' ')[1];
                    const user = await User.findOne({ telegramId: ctx.from.id });

                    if (user.authKey === authKey) {
                        await User.updateOne({ telegramId: ctx.from.id }, { isAuthorized: true });
                        ctx.reply('Вы успешно авторизованы! Теперь вам доступны дополнительные команды.');
                    } else {
                        ctx.reply('Неверный ключ авторизации.');
                    }
                }
            }

            module.exports = { bot, authHandler };

            async function registerHandler(ctx) {
                if (ctxCorrect(ctx)) {
                    const fullName = ctx.message.text.split(' ').slice(1).join(' ');
                    try {
                        const existingUser = await User.findOne({ telegramId: ctx.from.id });
                        if (existingUser) {
                            ctx.reply('Вы уже зарегистрированы.');
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
                        handleErrorReg(ctx.from.id, error);
                        return ctx.reply('Произошла ошибка с регистрацией. Администратор уже оповещен');
                    }
                }
            }

            async function deleteHandler(ctx) {
                const orderId = ctx.message.text.split(' ')[1];
                if (!orderId) {
                    return ctx.reply('Пожалуйста, укажите ID заказа.');
                }

                try {
                    const deletedOrder = await Order.findOneAndDelete({ orderId: orderId });
                    if (deletedOrder) {
                        return ctx.reply(`Заказ с ID ${orderId} успешно удален.`);
                    }
                } catch (error) {
                    const user = await User.findOne({ telegramId: ctx.from.id });
                    handleError(user, error);
                    return ctx.reply('Произошла ошибка с удалением. Администратор уже оповещен');
                }

            }

            async function addorderHandler(ctx) {

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

                const orderId = Math.random().toString(36).substr(2, 9);

                const newOrder = new Order({
                    orderId: orderId,
                    rewardAmount: rewardAmount,
                    userId: user._id,
                    comment: comment,
                });

                try {
                    await newOrder.save();
                    ctx.reply(`Заказ успешно добавлен. ID заказа: ${orderId}, сумма вознаграждения: ${rewardAmount}, комментарий: ${comment}`);
                } catch (error) {
                    handleError(user, error);
                    return ctx.reply('Произошла ошибка с созданием заказа. Администратору уже оповещен');
                }
            }

            async function takeorderHandler(ctx) {
                const orderId = ctx.message.text.split(' ')[1];
                if (!orderId) {
                    return ctx.reply('Пожалуйста, укажите ID заказа.');
                }
                try {
                    const user = await User.findOne({ telegramId: ctx.from.id });
                    const order = await Order.findOne({ orderId: orderId });
                    if (!order) {
                        return ctx.reply('Заказ не найден или он уже закрыт.');
                    }

                    if (order.executorId) {
                        return ctx.reply('У этого заказа уже есть исполнитель.');
                    } s

                    order.status = 'Назначен исполнитель';
                    order.executorId = user._id;
                    await order.save();

                    const orderCreator = await User.findById(order.userId);
                    if (orderCreator) {
                        const creatorLink = `tg://user?id=${orderCreator.telegramId}`;
                        ctx.telegram.sendMessage(orderCreator.telegramId, `Ваш заказ с ID: ${orderId} был принят пользователем ${user.fullName}. Вы можете начать чат с исполнителем: <a href="${creatorLink}">Чат с исполнителем</a>`, { parse_mode: "HTML" });
                        const userLink = `tg://user?id=${user.telegramId}`;
                        ctx.reply(`Вы назначены исполнителем заказа с ID: ${orderId}. Вы можете начать чат с создателем заказа: <a href="${userLink}">Чат с заказчиком</a>`, { parse_mode: "HTML" });
                    } else {
                        ctx.reply('Создатель заказа не найден.');
                    }
                } catch (error) {
                    handleError(user, error);
                    return ctx.reply('Произошла ошибка с назначение исполнителя. Администратор уже оповещен');
                }
            }

            async function openordersHandler(ctx) {
                try {
                    const orders = await Order.find({ status: 'Открыт' }).populate('userId');

                    if (orders.length === 0) {
                        return ctx.reply('Нет открытых заказов.');
                    }

                    let response = 'Открытые заказы:\n';
                    orders.forEach(order => {
                        response += `ID заказа: ${order.orderId}, Дата: ${order.orderDate.toLocaleString()}, Сумма: ${order.rewardAmount}, Комментарий: ${order.comment}\n`;
                    });

                    ctx.reply(response);
                } catch (error) {
                    const user = await User.findOne({ telegramId: ctx.from.id });
                    handleError(user, error);
                    return ctx.reply('Произошла ошибка с получением заказа. Администратор уже оповещен');
                }
            }

            async function ordersHandler(ctx) {
                if (!ctx.from || !ctx.from.id) {
                    return ctx.reply('Не удалось получить ваш Telegram ID.');
                }

                const user = await User.findOne({ telegramId: ctx.from.id });
                if (!user) {
                    return ctx.reply('Пользователь не найден.');
                }

                try {
                    const orders = await Order.find({ userId: user._id });
                    if (orders.length === 0) {
                        return ctx.reply('У вас нет открытых заказов.');
                    }

                    let response = 'Ваши заказы:\n';
                    orders.forEach(order => {
                        response += `ID: ${order.orderId}, Статус: ${order.status}, Сумма: ${order.rewardAmount}, Комментарий: ${order.comment}\n`;
                    });

                    ctx.reply(response);
                } catch (error) {
                    handleError(user, error);
                    return ctx.reply('Произошла ошибка с выводом списка заказов. Администратор уже оповещен');
                }
            }

            async function helpHandler(ctx) {
                if (!ctx.from || !ctx.from.id) {
                    return ctx.reply('Не удалось получить ваш Telegram ID.');
                }

                let response = 'Список доступных команд:\n/auth - Авторизация\n/register - Регистрация\n/help - Эта помощь\n';
                const user = await User.findOne({ telegramId: ctx.from.id });
                if (user && user.isAuthorized) {
                    response += '/orders - Просмотр открытых заказов\n/topup - Пополнение баланса\n/addorder - Добавление заказа\n/takeorder - Взять заказ\n/openorders - Просмотр всех открытых заказов\n/deleteorder - Удаление заказа'; // Добавьте другие команды, доступные после авторизации
                }
                ctx.reply(response);
            }

            bot.command('auth', authHandler);

            bot.command('register', registerHandler);

            const requireAuth = async (ctx, next) => {
                if (ctxCorrect(ctx)) {

                    const user = await User.findOne({ telegramId: ctx.from.id });

                    if (!user || !user.isAuthorized) {
                        return ctx.reply('Для выполнения этой команды необходимо авторизоваться с помощью /auth ВАШ_КЛЮЧ.');
                    }
                    return next(ctx);
                }
            };

            bot.command('deleteorder', requireAuth, deleteHandler);

            bot.command('addorder', requireAuth, addorderHandler);

            bot.command('takeorder', requireAuth, takeorderHandler);

            bot.command('openorders', requireAuth, openordersHandler);

            bot.command('orders', requireAuth, ordersHandler);

            bot.command('help', helpHandler);

            bot.on('text', (ctx) => {
                if (!ctx.message.text.startsWith('/')) return;
                ctx.reply('Неизвестная команда. Введите /help для получения списка команд.');
            });

            if (process.env.NODE_ENV !== 'test') {
                bot.launch().then(() => {
                    console.log('Бот запущен');
                }).catch(err => {
                    console.error('Ошибка при запуске бота:', err);
                });
            }
            module.exports = bot;
        })
        .catch((err) => {
            console.error(err);
        })
};