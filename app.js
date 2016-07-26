//import modules
var express = require('express');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');
var badyParser = require('body-parser');
var methodOverride = require('method-override');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');


//connect db
mongoose.connect(process.env.m_db);

var db = mongoose.connection;

db.once('open',function(){
    console.log('DB Connected!');
});

db.on('error',function(err){
    console.log('DB error : ', err);
});





//model setting
var postSchema = mongoose.Schema({
  title : { type:String, required:true},
  body : { type:String, required:true},
  createdAt : { type:Date, default:Date.now},
  updatedAt : Date
});
var Post = mongoose.model('post',postSchema);

var userSchema = mongoose.Schema({
  email : { type:String, required:true, unique:true},
  nickname : { type:String, required:true, unique:true},
  password : { type:String, required:true},
  createdAt : { type:Date, defautl:Date.now}
});

userSchema.pre("save", function(next){
  var user = this;
  if(! user.isModified('password')){
    return next();
  } else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
});

userSchema.methods.authenticate = function(password){
  var user = this;
  return bcrypt.compareSync(password,user.password);
};
userSchema.methods.hash = function(password){
  return bcrypt.hashSync(password,user.password);
};

var User = mongoose.model('user',userSchema);

//view setting
app.set("view engine", 'ejs');



//set middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(badyParser.json());
app.use(badyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());

app.use(session({secret:'MySecret'}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user,done){
  done(null, user.id);
});
passport.deserializeUser(function(id,done){
  User.findById(id, function(err,user){
    done(err,user);
  });
});
passport.use('local-login',
  new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  },
  function(req,email,password,done){
    User.findOne({ 'email' : email }, function(err,user){
      if(err){
        return done(err);
      }
      if(!user){
        req.flash('email', req.body.email);
        return done(null, false, req.flash('loginError', 'No user Found.'));
      }
      if(! user.authenticate(password)){
        req.flash('email', req.body.email);
        return done(null, false, req.flash('loginError', 'Password dose not Match'));
      }
      return done(null, user);
    });
  })
);

//routes setting
app.get('/', function(req,res){
  res.redirect("/posts");
});

app.get('/login', function(req,res){
  res.render('login/login',{email:req.flash('email')[0], loginError:req.flash('loginError')});
});

app.post('/login', function(req,res,next){
  req.flash('email');
  if( req.body.email.length === 0 || req.body.password.length === 0){
    req.flash('email' , req.body.email);
    req.flash('loginError' , 'Please enter both email and password.');
    res.redirect("/login");
  } else {
    next();
  }
}, passport.authenticate('local-login',{
    successRedirect : '/posts',
    failureRedirect : '/login',
    failureFlash : true
  })
);

app.get('/logout', function(req,res){
  passport.logout();
  res.redirect("/");
});

app.get('/users/new', function(req,res){
  res.render('users/new',{
    formData : req.flash('formData')[0],
    emailError : req.flash('emailError')[0],
    nicknameError : req.flash('nicknameError')[0],
    passwordError : req.flash('passwordError')[0]
  })
});

app.post('/users', checkUserRegValidation, function(req,res,next){
  User.create(req.body.user, function(err,user){
    if(err){ return res.json({succsess:false, message:err}); }
    res.redirect('/login');
  });
});


app.get('/users/:id', function(req,res){
  User.findById(req.params.id, function(err,user){
    if(err) { return res.json({succsess:false, message:err}); }
    res.render('users/show',{user:user});
  });
});

app.get('/users/:id/edit', function(req,res){
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

app.put('/users/:id', checkUserRegValidation, function(req,res){
  User.findById(req.params.id, req.body.user, function(err,user){
    if(err) { return res.json({succsess:false, message:err}); }
    if( user.authenticate(req.body.user.password)){
        if(req.body.user.newPassword){
          req.body.user.password = user.hash(req.body.user.newPassword);
          user.save();
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


app.get('/posts', function(req,res){
  Post.find({}).sort('-createdAt').exec(function(err,posts){
    if(err){
      return res.json({success:false, message:err});
    }
    res.render("posts/index", {data:posts , user:req.user});
  });
  // Post.find({},function(err,posts){
  //   if(err){
  //     return res.json({success:false, message:err});
  //   }
  //   res.json({success:true, data:posts});
  // });
});
app.get('/posts/new', function(req,res){
  res.render("posts/new");
});

app.post('/posts', function(req,res){
  Post.create(req.body.post, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    //res.json({success:true, data:post});
    res.redirect("/posts");
  });
});
app.get('/posts/:id', function(req,res){
  Post.findById(req.params.id, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    res.render("posts/show", {data:post});
    //res.json({success:true, data:post});
  });
});
app.get('/posts/:id/edit', function(req,res){
  Post.findById(req.params.id, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    res.render("posts/edit", {data:post});
    //res.json({success:true, data:post});
  });
});

app.put('/posts/:id', function(req,res){
  req.body.post.updatedAt = Date.now();
  Post.findByIdAndUpdate(req.params.id, req.body.post, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    //res.json({success:true, data:post._id+" updated"});
    res.redirect("/posts/"+req.params.id);
  });
});
app.delete('/posts/:id', function(req,res){
  Post.findByIdAndRemove(req.params.id, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    //res.json({success:true, data:post._id+" deleted"});
    res.redirect("/posts");
  });
});

// funtions
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

//start server
app.listen(3000, function(){
    console.log('Server On!');
});
