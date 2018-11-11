var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  port: {
    type: String,
    required: true,
  },
  id_token: {
    type: String,
    required: true,
  },
  friendship: {
    friends: {
      type: Array,
    },
    requests: {
      type: Array,
    },
    blocks: {
      type: Array,
    }
  }
});

//authenticate input against database
UserSchema.statics.authenticate = function (email, password, ip, port, callback) {
  User.findOne({ email: email })
    .exec(function (err, user) {
      if (err) {
        return callback(err)
      } else if (!user) {
        var err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }
      bcrypt.compare(password, user.password, function (err, result) {
        if (result === true) {
          // let myQuery = { email: email };
          // let newValues = {$set:{ip:ip, port:port}};
          // User.updateOne(myQuery, newValues, );
          user.ip = ip;
          user.port = port;
          return callback(null, user);
        } else {
          return callback();
        }
      })
    });
}

//hashing a password before saving it to the database
// UserSchema.pre('save', function (next) {
//   var user = this;
//   bcrypt.hash(user.password, 10, function (err, hash) {
//     if (err) {
//       return next(err);
//     }
//     user.password = hash;
//     next();
//   })
// });


var User = mongoose.model('User', UserSchema);
module.exports = User;
