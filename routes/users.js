var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../models/User');
var async = require('async');

router.get('/new', function(req,res){
  res.render('users/new',{
    user : req.user,
    formData : req.flash('formData')[0],
    emailError : req.flash('emailError')[0],
    nicknameError : req.flash('nicknameError')[0],
    passwordError : req.flash('passwordError')[0]
  })
});

router.post('/', checkUserRegValidation, function(req,res,next){
  User.create(req.body.user, function(err,user){
    if(err){ return res.json({succsess:false, message:err}); }
    res.redirect('/login');
  });
});


router.get('/:id', isLoggedIn, function(req,res){
  User.findById(req.params.id, function(err,user){
    if(err) { return res.json({succsess:false, message:err}); }
    res.render('users/show',{user:user});
  });
});

router.get('/:id/edit', isLoggedIn, function(req,res){
  if(req.user._id != req.params.id){
    return res.json({succsess:false, message:"Unauthhrized Attempt"});
  }
  User.findById(req.params.id, function(err,user){
    if(err) { return res.json({succsess:false, message:err}); }
    res.render('users/edit',{
      user:user,
      formData : req.flash('formData')[0],
      emailError : req.flash('emailError')[0],
      nicknameError : req.flash('nicknameError')[0],
      passwordError : req.flash('passwordError')[0]
    });
  });
});

router.put('/:id', isLoggedIn, checkUserRegValidation, function(req,res){
  if(req.user._id != req.params.id){
    return res.json({succsess:false, message:"Unauthhrized Attempt"});
  }
  User.findById(req.params.id, req.body.user, function(err,user){
    if(err) { return res.json({succsess:false, message:err}); }
    if( user.authenticate(req.body.user.password)){
        if(req.body.user.newPassword){
          req.body.user.password = user.hash(req.body.user.newPassword);
        } else {
            delete req.body.user.password;
        }
        User.findByIdAndUpdate(req.params.id, req.body.user, function(){
          if(err){ return res.json({succsess:false, message:err}); }
          res.redirect('/users/'+req.params.id);
        });
    } else {
      req.flash('formData', req.body.user);
      req.flash('passwordError',' - Invalid password');
      res.redirect('/users/'+req.params.id+'/edit');
    }
  });
});

// funtions


function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

function checkUserRegValidation(req, res, next){
  var isValid = true;

  async.waterfall(
    [function(callback){
      User.findOne({ email: req.body.user.email, _id : {$ne : mongoose.Types.ObjectId(req.params.id)}},
        function(err,user){
          if(user){
            isValid = false;
            req.flash("emailError"," - This email is already resistered.");
          }
          callback(null, isValid);
        }
      );
    }, function(isValid, callback){
      User.findOne({ email: req.body.user.nickname, _id : {$ne : mongoose.Types.ObjectId(req.params.id)}},
        function(err,user){
          if(user){
            isValid = false;
            req.flash("nicknameError"," - This nickname is already resistered.");
          }
          callback(null, isValid);
        }
      );
    }], function(err, isValid){
      if(err) { return res.json({success:false, message:err});  }
      if(isValid){
        return next();
      } else {
        req.flash('formData',req.body.user);
        res.redirect('back');
      }
    }
  );

}





module.exports = router;
