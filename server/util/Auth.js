const User = require('../models/user');

var authChecker = function(req, res, next){
    if(req.headers.authorization) {
        User.findOne({ id_token: req.headers.authorization })
        .exec(function (err, user) {
          if(err || !user) {
            let response = {
              flag: true,
              msg: "Invalid token."
            };
            return res.send(response);
          }
          else {
            next();
          }
        })
      }
      else {
          let response = {
            flag: false,
            msg: "Invalid headers."
          };
          return res.send(response);
      }
  };
  
  module.exports = {
    authChecker: authChecker,
  };
