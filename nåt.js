// Dependencies
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mysql = require('mysql');
const PHPUnserialize = require('php-unserialize');

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'chat_app'
});

connection.connect();

// Express Setup
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected');

    // User sends message
    socket.on('chat message', (msg) => {
        console.log('Message: ' + msg);

        // Check if message is a command
        if (msg.startsWith('/')) {
            const command = msg.substring(1);

            // Fetch auto response from database
            connection.query('SELECT * FROM auto_responses WHERE command = ?', [command], (error, results, fields) => {
                if (error) throw error;

                if (results.length > 0) {
                    const response = PHPUnserialize.unserialize(results[0].response);
                    socket.emit('bot message', response);
                } else {
                    socket.emit('bot message', 'Unknown command');
                }
            });
        } else {
            socket.broadcast.emit('chat message', msg);
        }
    });

    // User disconnects
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start Server
http.listen(3000, () => {
    console.log('Listening on *:3000');
});
