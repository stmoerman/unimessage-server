var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
const socketio = require('socket.io');
var io = socketio(server);
var p2p = require('socket.io-p2p-server').Server;
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var User = require('./models/user');

// var session = require('express-session');
// var MongoStore = require('connect-mongo')(session);

//connect to MongoDB
mongoose.connect('mongodb://localhost/unimessage');
var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
});

//use sessions for tracking logins
// app.use(session({
//   secret: 'work hard',
//   resave: false,
//   saveUninitialized: false,
//   store: new MongoStore({
//     mongooseConnection: db
//   })
// }));

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



// serve static files from template
// app.use(express.static(__dirname + '/templateLogReg'));

// include routes
var routes = require('./routes/router');
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

io.use(p2p);

var socketStat={};
io.on('connection', (socket) => {
  console.log('a user connected');

  setInterval(() => {
    if (!!!socketStat[socket.id]) {
      socketStat[socket.id] = 1;
    User.find({}, function (err, users) {
      users.forEach(function (user) {
        // console.log(user);
          socket.on(user._id,(msg) => {
            socket.broadcast.emit(user._id,{"msg":msg});
          }) 
        
      });
    })}}, 1000);

  socket.on('disconnect', () => {
    console.log('a user disconnected');
    socketStat[socket.id] = 0;
  });
});

// listen on port 3000
server.listen(3000, function () {
  console.log('Express app listening on port 3000');
});

module.exports = {io};
