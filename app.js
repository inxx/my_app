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
app.use(paassport.initialize());
app.use(passport.session());

passport.serializeUser(function(user,done){
  done(null, user.id);
});
passport.deserializeUser(function(id,done){
  User.findIdBy(id, function(err,user){
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
      if(user.password != password){
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

app.get('/posts', function(req,res){
  Post.find({}).sort('-createdAt').exec(function(err,posts){
    if(err){
      return res.json({success:false, message:err});
    }
    res.render("posts/index", {data:posts});
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


app.listen(3000, function(){
    console.log('Server On!');
});
