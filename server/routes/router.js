var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bcrypt = require('bcrypt');
const jwtsign = require('../util/JWT').sign;
const jwtverify = require('../util/JWT').verify;
const jwtdecode = require('../util/JWT').decode;
const auth = require('../util/Auth');

// GET route for reading data
// router.get('/', function (req, res, next) {
//   return res.sendFile(path.join(__dirname + '/templateLogReg/index.html'));
//   return res.send("hompage");
// });


//POST route for user register
router.post('/register', function (req, res, next) {
  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    let response = {
      flag: false,
      msg: "Password do not match."
    };
    return res.send(response);
  }

  // all fields have no empty values.
  if (req.body.email &&
    req.body.username &&
    req.body.password &&
    req.body.passwordConf &&
    req.body.ip &&
    req.body.port) {

    var token = jwtsign({ email: req.body.email, fullName: req.body.username });
    hash_password = bcrypt.hashSync(req.body.password, 10);

    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: hash_password,
      ip: req.body.ip,
      port: req.body.port,
      id_token: token
    }

    User.create(userData, function (error, user) {
      if (error) {
        let response = {
          flag: false,
          msg: "Register fails"
        };
        return res.send(response);
      } else {
        let response = {
          flag: true,
          msg: "Register Successfully",
          data: {
            id_token: token,
          }
        };
        return res.send(response);
      }
    });

  } else {
    let response = {
      flag: false,
      msg: "All fields required."
    };
    return res.send(response);
  }
})

// POST Router for login using username and password
router.post('/login', function (req, res, next) {
  if (req.body.email && req.body.password && req.body.ip && req.body.port) {
    User.authenticate(req.body.email, req.body.password, req.body.ip, req.body.port, function (error, user) {
      if (error || !user) {
        let response = {
          flag: false,
          msg: "Wrong email or password."
        };
        return res.send(response);
      } else {
        var token = jwtsign({ email: user.email, fullName: user.username, _id: user._id });
        user.id_token = token;
        user.save();

        let response = {
          flag: true,
          msg: "login successfully",
          data: {
            id_token: token,
          }
        };
        return res.send(response);
      }
    });
  }
  else {
    let response = {
      flag: false,
      msg: "Cannot get IP address and port number."
    };
    return res.send(response);
  }
});

// JWT verification for logout 
router.post('/logout', auth.authChecker, function (req, res, next) {
  User.findOne({ id_token: req.headers.authorization })
    .exec(function (err, user) {
      user.id_token = "no";
      user.save();

      let response = {
        flag: true,
        msg: "Logout successfully."
      };
      return res.send(response);
    })
});

module.exports = router;
