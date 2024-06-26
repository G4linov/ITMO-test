require('dotenv').config(); // Импорт и загрузка переменных окружения из файла .env
require('events').EventEmitter.defaultMaxListeners = 15;
const { Telegraf } = require('telegraf');


// Создаем экземпляр бота с использованием токена из переменной окружения
const bot = new Telegraf(process.env.BOT_TOKEN);

// Обработчик команды /start для начала работы с ботом
bot.command('start', (ctx) => {
    ctx.reply('Привет! Я бот. Чтобы начать работу, отправь мне команду /help.');
});



// Обработчик команды /help для вывода справки
bot.command('help', (ctx) => {
    ctx.reply('Список доступных команд:\n/help - Вывести эту справку\n/echo [текст] - Эхо-ответ на ваше сообщение');
});

// Обработчик команды /echo для эхо-ответа на сообщение пользователя
bot.command('echo', (ctx) => {
    const message = ctx.message.text.split(' ').slice(1).join(' '); // Получаем текст сообщения после команды /echo
    if (message) {
        ctx.reply(message); // Отправляем эхо-ответ
    } else {
        ctx.reply('Вы не указали текст для эхо-ответа. Используйте команду в формате: /echo [текст]');
    }
});

bot.command('auth', (ctx) => {
    ctx.reply('Введите авторизационный ключ:');
});

bot.on('text', (ctx) => {
    const authKey = ctx.message.text.trim(); // Получаем текст сообщения
    // Проверяем авторизационный ключ
    if (authKey === process.env.AUTH_KEY) {
        // Если ключ верный, разрешаем доступ и предоставляем функционал бота
        ctx.reply('Вы успешно авторизованы! Теперь вы можете пользоваться функционалом бота.');
        // Добавьте здесь функционал, который должен быть доступен после авторизации
    } else {
        // Если ключ неверный, сообщаем об ошибке
        ctx.reply('Неверный авторизационный ключ. Попробуйте снова или обратитесь к администратору бота.');
    }
});

// Обработка текстовых сообщений
bot.on('text', (ctx) => {
    ctx.reply('Неизвестная команда. Используйте /help для получения списка доступных команд.');
});

// Запускаем бот
bot.launch()
    .then(() => console.log('Бот запущен'))
    .catch((err) => console.error('Ошибка запуска бота:', err));
