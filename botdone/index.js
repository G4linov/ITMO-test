require('dotenv').config();
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/telegrambot', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const UserSchema = new mongoose.Schema({
    telegramId: { type: Number, unique: true },
    fullName: String,
    authKey: String,
    isAuthorized: { type: Boolean, default: false }
});

const OrderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    status: { type: String, default: 'Открыт' },
    orderDate: { type: Date, default: Date.now },
    rewardAmount: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    executorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    comment: { type: String, default: '' },
});

const adminTelegramId = 395143060;
const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('auth', async (ctx) => {
    if (!ctx.from || !ctx.from.id) {
      return ctx.reply('Не удалось получить ваш Telegram ID.');
    }
  
    const authKey = ctx.message.text.split(' ')[1];
    const user = await User.findOne({ telegramId: ctx.from.id });
  
    if (user && user.authKey === authKey) {
      await User.updateOne({ telegramId: ctx.from.id }, { isAuthorized: true });
      ctx.reply('Вы успешно авторизованы! Теперь вам доступны дополнительные команды.');
    } else {
      ctx.reply('Неверный ключ авторизации.');
    }
});

bot.command('register', async (ctx) => {
    if (!ctx.from || !ctx.from.id) {
      return ctx.reply('Не удалось получить ваш Telegram ID.');
    }
  
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
});
  
// Запускаем бота
bot.launch().then(() => {
    console.log('Бот запущен');
});
  