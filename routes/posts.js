var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Post = require('../models/Post');


router.get('/', function(req,res){
  var page = Math.max(1, req.query.page);
  var limit = 10;
  Post.count({}, function(err, count){
    if(err){ return res.json({success:false, message:err});}
    var skip = (page-1)*limit;
    var maxPage = Math.ceil(count/limit);

    Post.find({}).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function(err,posts){
      if(err){ return res.json({success:false, message:err});}
      res.render("posts/index", {
        posts:posts,
        user:req.user,
        page:page,
        maxPage:maxPage,
        postMessage:req.flash("postsMessage")[0]
      });
    });
  });

  // Post.find({},function(err,posts){
  //   if(err){
  //     return res.json({success:false, message:err});
  //   }
  //   res.json({success:true, data:posts});
  // });
});
router.get('/new', isLoggedIn, function(req,res){
  res.render("posts/new" , {user:req.user});
});

router.post('/', isLoggedIn, function(req,res){
  req.body.post.author = req.user._id;
  Post.create(req.body.post, function(err,post){
    if(err){
      return res.json({success:false, message:err});
    }
    //res.json({success:true, data:post});
    res.redirect("/posts");
  });
});
router.get('/:id',  function(req,res){
  Post.findById(req.params.id).populate("author").exec(function(err,post){
    if(err){ return res.json({success:false, message:err}); }
    res.render("posts/show", {post:post, user:req.user});
    //res.json({success:true, data:post});
  });
});
router.get('/:id/edit', isLoggedIn, function(req,res){
  Post.findById(req.params.id, function(err,post){
    if(err){ return res.json({success:false, message:err});}
    if(!req.user._id.equals(post.author)){
     return res.json({success:false, message:"Unauthhrized Attempt"});
    }
    res.render("posts/edit", {post:post, user:req.user});
    //res.json({success:true, data:post});
  });
});

router.put('/:id', isLoggedIn, function(req,res){
  req.body.post.updatedAt = Date.now();
  Post.findOneAndUpdate({ _id : req.params.id, author : req.user._id},req.body.post, function(err,post){
    if(err){ return res.json({success:false, message:err}); }
    if(!post){
      return res.json({success:false, message:"No data found to update"});
    }
    res.redirect("/posts/"+req.params.id);
    //res.json({success:true, data:post._id+" updated"});
  });
});
router.delete('/:id', isLoggedIn, function(req,res){
  Post.findOneAndRemove({ _id : req.params.id, author : req.user._id}, function(err,post){
    if(err){ return res.json({success:false, message:err}); }
    if(!post){
      return res.json({success:false, message:"No data found to update"});
    }
    //res.json({success:true, data:post._id+" deleted"});
    res.redirect("/posts");
  });
});


function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}


module.exports = router;
