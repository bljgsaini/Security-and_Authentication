
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const bcrypt = require('bcrypt'); /*https://www.npmjs.com/package/bcrypt*/
const saltRounds = 10;


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/secretsDB", {useNewUrlParser: true, useUnifiedTopology: true});

const secrestsSchema = new mongoose.Schema({
  username : {
      type : String,
      required : true
  },
  password : {
      type : String,
      required : true
  }
});



const Secret = mongoose.model("Secret", secrestsSchema);


app.get("/", function(req, res){
    res.render("home");
});


app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", function(req, res){

    Secret.findOne({username : req.body.username}, function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(foundUser){
                // Load hash from your password DB and compare it with the entered password's 
                bcrypt.compare(myPlaintextPassword, hash).then(function(result) {
                    if(result === true){
                        res.redirect("/secrets");
                    }else{
                        console.log("password didn't match");
                        res.redirect("/login");
                    }
                });
            }else{
                console.log("user is not present in the database");
                res.redirect("/register");
            }
        }
    })

});

app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    // hash the password and save into the database with salting
    bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
        const secret = new Secret({
            username : req.body.username,
            password : hash
        });

        secret.save(function(err){
            if(err) {
                console.log(err);
            }else{
                console.log("User saved in the database");
            }
        });
        res.redirect("/secrets");
    }); 
    
});


app.get("/secrets", function(req, res){
    res.render("secrets");
});

app.get("/submit", function(req, res){
    res.render("submit");
})


app.get("/logout", function(req, res){
    res.redirect("/");
})


app.listen( 3000, function(){
    console.log("Server started successfully");
});
