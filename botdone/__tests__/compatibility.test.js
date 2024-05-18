const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    await mongoServer.start(); // Запуск сервера
    const uri = await mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop(); // Остановка сервера
});

describe('MongoMemoryServer compatibility test', () => {
    it('should connect to MongoMemoryServer and perform basic operations', async () => {
        // Perform basic operations here, such as creating a collection, inserting documents, etc.
        // For example:
        const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
        await TestModel.create({ name: 'test' });
        const foundDoc = await TestModel.findOne({ name: 'test' });
        expect(foundDoc.name).toEqual('test');
    });
});
