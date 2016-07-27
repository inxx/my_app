//import modules
var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var session = require('express-session');
var flash = require('connect-flash');
var badyParser = require('body-parser');
var methodOverride = require('method-override');

//connect db
mongoose.connect(process.env.m_db);

var db = mongoose.connection;

db.once('open',function(){
    console.log('DB Connected!');
});

db.on('error',function(err){
    console.log('DB error : ', err);
});

//view setting
app.set("view engine", 'ejs');


//set middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(badyParser.json());
app.use(badyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());
app.use(session({secret:'MySecret'}));


//passport
var passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// routes
app.use('/', require('./routes/home'));
app.use('/users', require('./routes/users'));
app.use('/posts', require('./routes/posts'));



//start server
var port = process.env.PORT || 3000;
app.listen(port, function(){
    console.log('Server On!');
});
