var express = require('express');
var router = express.Router();
var User = require('../models/user');


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

  if (req.body.email &&
    req.body.username &&
    req.body.password &&
    req.body.passwordConf &&
    req.body.ip &&
    req.body.port) {

    var userData = {
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      ip: req.body.ip,
      port: req.body.port,
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
            msg: "Register Successfully"
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
    if (req.body.email && req.body.password) {
        User.authenticate(req.body.email, req.body.password, req.body.ip, req.body.port, function (error, user) {
          if (error || !user) {
            let response = {
                flag: false,
                msg: "Wrong email or password."
            };
            return res.send(response);
          } else {
            req.session.userId = user._id;
            let response = {
                flag: true,
                msg: "login successfully"
            };
            return res.send(response);
          }
        });
    } 
});

// GET Router for login using sessions
router.get('/login', function (req, res, next) {
  User.findById(req.session.userId)
  .exec(function (error, user) {
    if (error) {
      let response = {
          flag: false,
          msg: "Please input your username and password to login."
      };
      return res.send(response);
    } else {
      if (user === null) {
        let response = {
          flag: false,
          msg: "Please input your username and password to login."
        };
        return res.send(response);

      } else {
        let response = {
            flag: true,
            msg: "login successfully by sessions"
        };
        return res.send(response);            
      }
    }
  });
});

// GET Router for logout 
router.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        let response = {
            flag: true,
            msg: "logout successful",
        };
        return res.send(response);
      }
    });
  }
});

module.exports = router;
