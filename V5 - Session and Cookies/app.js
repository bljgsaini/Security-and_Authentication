
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret : "our little secret",
    resave : false,
    saveUninitialized : true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  username : {
      type : String,
      required : true
  },
  password : {
      type : String
  }
});

userSchema.plugin(passportLocalMongoose);


const User = mongoose.model("User", userSchema);


passport.use(User.createStrategy());
 
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
    res.render("home");
});


app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function(req, res){

    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }else{
            passport.authenticate("local")(req, res, function(err){
                res.render("secrets");
            });
        }
    })

});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    User.register({username : req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});




app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/submit", function(req, res){
    res.render("submit");
})


app.get("/logout", function(req, res){
    req.logOut();
    res.redirect("/");
})


app.listen( 3000, function(){
    console.log("Server started successfully");
});
