
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret : "our little secret",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  username : String,
  password : String,
  googleId : String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);


passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

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
                res.redirect("/secrets");
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


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);


app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets');
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        User.find( {"secret" : {$ne : null}}, function(err, foundUsers){
            if(err){
                console.log(err);
            }else{
                console.log(foundUsers);
                if(foundUsers){
                    res.render("secrets", { usersWithSecrets : foundUsers });
                }
            }
        });
    }else{
        res.redirect("/login");
    }
});

app.get("/submit", function(req, res){
    res.render("submit");
});


app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    
    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }
        }
    })

})


app.get("/logout", function(req, res){
    req.logOut();
    res.redirect("/");
});

app.on('listening',function(){
    console.log('ok, server is running');
});

app.listen( 3000, function(){
    console.log("Server started successfully");
});
