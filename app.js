//import modules
var express = require('express');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var badyParser = require('body-parser');


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


//view setting
app.set("view engine", 'ejs');



//set middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(badyParser.json());



//routes setting
app.get('/', function(req,res){

  res.render('index_ejs',data);

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
app.post('/posts', function(req,res){
  Post.create(req.body.post, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    res.json({success:true, data:post});
  });
});
app.get('/posts/:id', function(req,res){
  Post.findById(req.params.id, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    res.json({success:true, data:post});
  });
});
app.put('/posts/:id', function(req,res){
  req.body.post.updatedAt = Date.now();
  Post.findByIdAndUpdate(req.params.id, req.body.post, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    res.json({success:true, data:post._id+" updated"});
  });
});
app.delete('/posts/:id', function(req,res){
  Post.findByIdAndRemove(req.params.id, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    res.json({success:true, data:post._id+" deleted"});
  });
});


app.listen(3000, function(){
    console.log('Server On!');
});
