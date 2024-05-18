module.exports = {
    mongodbMemoryServerOptions: {
      binary: {
        version: '4.4.0', // Укажите версию MongoDB
        skipMD5: true
      },
      autoStart: false,
      instance: {
        dbName: 'test' // Укажите имя базы данных
      }
    }
};