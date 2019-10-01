const keys = require('./keys');

// Express App Setup
const express = require('express');
const bodyparser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyparser.json());

// Postgres Setup
const { Pool } = require('pg');
const pgCliente = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort,
});

pgCliente.on('error', err => console.log(`pg Error: ${err}`));

pgCliente.query('CREATE TABLE IF NOT EXISTS values (number INT)');

// Redis client Setup
const redis = require('redis');

const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.port,
    retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

// Express routes

app.get('/', (req, res) => {
    res.send('Hi!');
});

app.get('/values/all', async (req, res) => {
    const values = await pgCliente.query('SELECT * from values');
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err, values) => {
        res.send(values);
    })
});

app.post('/values', async (req, res) => {
    const index = +req.body.index;
    if (index > 40) {
        return res.status(422).send('Index too high');
    }
    redisClient.hset('values', index, 'calculalintg...');
    redisPublisher.publish('insert', index);

    pgCliente.query('INSERT INTO values (number) VALUES($1)', [index]);

    res.send('Working...');
});

app.listen(5000, err => console.log(err));

