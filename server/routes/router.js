var express = require('express');
var router = express.Router();
var User = require('../models/user');
var bcrypt = require('bcrypt');
const jwtsign = require('../util/JWT').sign;
const jwtverify = require('../util/JWT').verify;
const jwtdecode = require('../util/JWT').decode;
const auth = require('../util/Auth');
const db = require('mongodb');

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
            id: user._id,
            username: user.username,
            id_token: token,
          }
        };
        return res.send(response);
      }
    })

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
            id: user._id,
            username: user.username,
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

// friendship management
router.get('/friendship/info', auth.authChecker, function (req, res, next) {
  User.findOne({ id_token: req.headers.authorization })
    .exec(async function (err, user) {
      var friends_list = [];
      var requests_list = [];
      var blocks_list = [];

      // user.friendship.friends.forEach(function(item) {
      //   // console.log(item);
      //   let user = User.find({ _id: db.ObjectId(item) });
      //   friends_list.push({"dst_id":item, "dst_username": user.username});
      // });
      for (let i = 0; i < user.friendship.friends.length; i++) {
        let item = user.friendship.friends[i];
        let temp_user = await User.findOne({ _id: db.ObjectId(item) });
        // console.log(temp_user);
        friends_list.push({ "dst_id": item, "dst_username": temp_user.username });
      }
      for (let i = 0; i < user.friendship.requests.length; i++) {
        let item = user.friendship.requests[i];
        let temp_user = await User.findOne({ _id: db.ObjectId(item) });
        // console.log(temp_user);
        requests_list.push({ "dst_id": item, "dst_username": temp_user.username });
      }
      for (let i = 0; i < user.friendship.blocks.length; i++) {
        let item = user.friendship.blocks[i];
        let temp_user = await User.findOne({ _id: db.ObjectId(item) });
        // console.log(temp_user);
        blocks_list.push({ "dst_id": item, "dst_username": temp_user.username });
      }

      // user.friendship.blocks.forEach(function(item) {
      //   // console.log(item);
      //   let user = User.find({ _id: db.ObjectId(item) });
      //   blocks_list.push({"dst_id":item, "dst_username": user.username});
      // });

      // console.log(friends_list);
      // console.log(requests_list);
      // console.log(blocks_list);

      let response = {
        flag: true,
        friend: friends_list,
        request: requests_list,
        block: blocks_list,
      };
      return res.send(response);
    })
});

// return online users
router.get('/friendship/search', auth.authChecker, function (req, res, next) {
  User.find({}, function (err, users) {
    var results = [];
    users.forEach(function (user) {
      if (user.id_token != "no" && user.id_token != req.headers.authorization) {
        results.push({ "dst_id": user._id, "dst_username": user.username });
      }
    });

    let response = {
      flag: true,
      result: results
    };
    return res.send(response);
  });
});

// add a user into the request list. when
// 1. he is not your friend.
// 2. he doesn't receive your request.
// 3. he doesn't block you.
router.post('/friendship/request', auth.authChecker, function (req, res, next) {
  User.findOne({ _id: db.ObjectId(req.body.dst_id) })
    .exec(async function (err, user) {
      // console.log(req.body.dst_id);
      // console.log(user);
      let src_user = await User.findOne({ _id: db.ObjectId(req.body.src_id) });
      if (user && src_user && !src_user.friendship.blocks.includes(req.body.dst_id) && !user.friendship.friends.includes(req.body.src_id) && !user.friendship.requests.includes(req.body.src_id) && !user.friendship.blocks.includes(req.body.src_id)) {
        user.friendship.requests.push(req.body.src_id);
        user.save();
        let response = {
          flag: true,
          msg: "send the request msg successfully."
        };
        return res.send(response);
      }
      else {
        let response = {
          flag: false,
          msg: "request failed."
        };
        if (src_user.friendship.blocks.includes(req.body.dst_id)) {
          response.msg = "You block this guy. unblock him at first.";
        }
        if (user.friendship.requests.includes(req.body.src_id)) {
          response.msg = "You have sent the request already.";
        }
        if (user.friendship.blocks.includes(req.body.src_id)) {
          response.msg = "You have been blocked by this user.";
        }
        if (user.friendship.friends.includes(req.body.src_id)) {
          response.msg = "This person has already been your friend.";
        }
        return res.send(response);
      }
    })
});

// manipulate users in the request list, turn it into your friend list. and let it add you into it's friends array
router.post('/friendship/confirm', auth.authChecker, function (req, res, next) {
  User.findOne({ _id: db.ObjectId(req.body.src_id) })
    .exec(async function (err, user) {
      if (user.friendship.requests.includes(req.body.dst_id)) {
        // src
        let pos = user.friendship.requests.indexOf(req.body.dst_id);
        user.friendship.requests.splice(pos, 1);
        user.friendship.friends.push(req.body.dst_id);
        user.save();
        // dst
        let temp_user = await User.findOne({ _id: db.ObjectId(req.body.dst_id) });
        // console.log(temp_user);
        temp_user.friendship.friends.push(req.body.src_id);
        temp_user.save();
      }
      let response = {
        flag: true,
        msg: "add the friend successfully."
      };
      return res.send(response);
    })
});

// manipulate users in the request list, delete it
router.post('/friendship/decline', auth.authChecker, function (req, res, next) {
  User.findOne({ _id: db.ObjectId(req.body.src_id) })
    .exec(async function (err, user) {
      if (user.friendship.requests.includes(req.body.dst_id)) {
        let pos = user.friendship.requests.indexOf(req.body.dst_id);
        user.friendship.requests.splice(pos, 1);
        user.save();
      }
      let response = {
        flag: true,
        msg: "decline this friend request."
      };
      return res.send(response);
    })
});

// manipulate users in the request list, turn it into your block list.
router.post('/friendship/block', auth.authChecker, function (req, res, next) {
  User.findOne({ _id: db.ObjectId(req.body.src_id) })
    .exec(function (err, user) {
      if (user.friendship.requests.includes(req.body.dst_id)) {
        let pos = user.friendship.requests.indexOf(req.body.dst_id);
        user.friendship.requests.splice(pos, 1);
        user.friendship.blocks.push(req.body.dst_id);
        user.save();
      }

      let response = {
        flag: true,
        msg: "block this guy successfully."
      };
      return res.send(response);
    })
});

// manipulate users in the friend list, unfriend with it.
router.post('/friendship/unfriend', auth.authChecker, function (req, res, next) {
  User.findOne({ _id: db.ObjectId(req.body.src_id) })
    .exec(async function (err, user) {
      if (user.friendship.friends.includes(req.body.dst_id)) {
        // src
        let pos = user.friendship.friends.indexOf(req.body.dst_id);
        user.friendship.friends.splice(pos, 1);
        user.save();

        // dst
        let temp_user = await User.findOne({ _id: db.ObjectId(req.body.dst_id) });
        // console.log(temp_user);
        let pos2 = temp_user.friendship.friends.indexOf(req.body.src_id);
        temp_user.friendship.friends.splice(pos2, 1);
        temp_user.save();
      }

      let response = {
        flag: true,
        msg: "unfriend this guy successfully."
      };
      return res.send(response);
    })
});

// manipulate users in the block list, unblock it.
router.post('/friendship/unblock', auth.authChecker, function (req, res, next) {
  User.findOne({ _id: db.ObjectId(req.body.src_id) })
    .exec(function (err, user) {
      if (user.friendship.blocks.includes(req.body.dst_id)) {
        let pos = user.friendship.blocks.indexOf(req.body.dst_id);
        user.friendship.blocks.splice(pos, 1);
        user.save();
      }

      let response = {
        flag: true,
        msg: "unblock this person successfully."
      };
      return res.send(response);
    })
});

// return online friends
router.get('/friendship/online', auth.authChecker, function (req, res, next) {
  User.findOne({ id_token: req.headers.authorization })
    .exec(async function (err, user) {
      var online_friends_list = new Array();
      // user.friendship.friends.forEach(function(item) {
      //   // console.log(item);
      //   let user = User.find({ _id: db.ObjectId(item) });
      //   friends_list.push({"dst_id":item, "dst_username": user.username});
      // });
      for (let i = 0; i < user.friendship.friends.length; i++) {
        let item = user.friendship.friends[i];
        let temp_user = await User.findOne({ _id: db.ObjectId(item) });
        // console.log(temp_user);
        if(temp_user.id_token != "no") {
          online_friends_list.push({ "dst_id": item, "dst_username": temp_user.username });
        }
      }
      
      // user.friendship.blocks.forEach(function(item) {
      //   // console.log(item);
      //   let user = User.find({ _id: db.ObjectId(item) });
      //   blocks_list.push({"dst_id":item, "dst_username": user.username});
      // });

      // console.log(friends_list);
      // console.log(requests_list);
      // console.log(blocks_list);

      let response = {
        flag: true,
        onlineFriends: online_friends_list,
      };
      return res.send(response);
    })
});

// update a user's public key.
router.post('/updateKey', auth.authChecker, function (req, res, next) {
  User.findOne({ id_token: req.headers.authorization })
    .exec(function (err, user) {
      // console.log("[test]", req.body.pubkey);
      user.key = req.body.pubkey;
      user.save();
      console.log("save key...");
      let response = {
        flag: true,
        msg: "save the public key successfully."
      };
      return res.send(response);
    })
});

// get a user's public key.
router.post('/key', auth.authChecker, function (req, res, next) {
  User.findOne({ _id: db.ObjectId(req.body.dst_id) })
    .exec(function (err, user) {
      let response = {
        flag: true,
        msg: user.key
      };
      // console.log(response);
      return res.send(response);
    })
});

module.exports = router;
