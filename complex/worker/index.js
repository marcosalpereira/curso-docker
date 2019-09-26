const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.port,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

redisPublisher.on('message', (ch, message) => {
    redisClient.hset('values', message, fib(+message));
});

redisPublisher.subscribe('insert');