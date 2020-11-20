//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

const itemsSchema={name:String,
sname:String,c1name:String,c2name:String,c3name:String};
const Item=mongoose.model("Item",itemsSchema);
const reportsSchema={helper:String};
const Report=mongoose.model("Report",reportsSchema);

const report1=new Report({
  helper:"Hi how abt u?"
});

const item1=new Item({
  name:"Your friends asked to:"
});


const defaultItems=[item1];
const defaultReports=[report1];

const listSchema={
  name:String,
  items:[itemsSchema],
  reports:[reportsSchema]
};
const List=mongoose.model("List",listSchema);


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://Admin-RemindMe:Swiss8uk@cluster0-aet7q.mongodb.net/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,

});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


app.get("/", function(req, res){

  res.render("login");
});








app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){

    if (err) {

    res.redirect("/submit");
    } else {

      passport.authenticate("local")(req, res, function(){
        const list=new List({
          name:req.body.username,
          items:defaultItems,

        });
        list.save();

      res.redirect("/"+list.name);

 });



  }

});

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function(){

      res.redirect("/"+user.username);

      });
    }
  });

});
app.get("/submit",function(req,res){
  res.render("submit");
});

app.post("/list",function(req,res){
  if (req.isAuthenticated()){
  const itemName=req.body.newItem;
  const listName=req.body.list;
  const item=new Item({
    name:itemName
  });
  if(listName==="Today"){
    item.save();
    res.redirect("/list");
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
}
});

app.post("/send",function(req,res){
  if (req.isAuthenticated()){
  const msg=req.body.reqst;
  const client1=req.body.send1;
  const client2=req.body.send2;
  const client3=req.body.send3;
  const sName=req.body.sender;

  const item=new Item({
    name:sName+'-->'+msg,
    sname:sName,
    c1name:client1,
    c2name:client2,
    c3name:client3,

  });




  if(client1==="Today"){
    item.save();
    res.redirect("/list");

  }else{

    item.save();


    List.findOne({name:client1},function(err,foundList){
      if(foundList){

        foundList.items.push(item);

        foundList.save();



      }

    });

    List.findOne({name:client2},function(err,foundList){
      if(foundList){
        foundList.items.push(item);

  foundList.save();

      }
    });

    List.findOne({name:client3},function(err,foundList){
      if(foundList){
        foundList.items.push(item);

                foundList.save();

    }
    });


     res.redirect("/"+sName);
  }

}
});





  app.post("/finish",function(req,res){

    if (req.isAuthenticated()){
      const msgdetail=req.body.msgdetail;
      const sname= req.body.sdetail;
      const hn= req.body.hdetail;
      const done=req.body.done;
      const c1=req.body.c1;
      const c2=req.body.c2;
      const c3=req.body.c3;


    const report=new Report({
      helper:msgdetail+"- is completed by: "+hn
    });
    console.log("llllll");
    if(sname==="Today"){
      item.save();
      res.redirect("/list");
    }else{
      List.findOne({name:sname},function(err,foundList){
        foundList.reports.push(report);
        foundList.save();

      });
      if(c1!=null){
      List.findOneAndUpdate({name:c1},{$pull:{items:{_id:done}}},function(err,foundReport){

        if(!err){
            console.log(c1);

        }
      });
             }
             if(c2!=null){
             List.findOneAndUpdate({name:c2},{$pull:{items:{_id:done}}},function(err,foundReport){

               if(!err){
                   console.log(c2);

               }
             });
                    }

                    if(c3!=null){
                    List.findOneAndUpdate({name:c3},{$pull:{items:{_id:done}}},function(err,foundReport){

                      if(!err){
                          console.log(c3);

                      }
                    });
                           }
          res.redirect("/"+hn);
    }


  }
  });

  app.get("/:customListName",function(req,res){

      if (req.isAuthenticated()){
    const customListName=req.params.customListName;


    List.findOne({name:customListName},function(err,foundList){
      if(!err){
        if(foundList){

      res.render("list",{TheDay:foundList.name,newItem:foundList.items,noc:foundList.reports.length});
        }
        else{
            res.redirect("/");
        }
      }
    });
  }
  else{
    res.redirect("/");
  }
    });

    app.get("/out/:customListName",function(req,res){

      if (req.isAuthenticated()){
      const customListName=req.params.customListName;

      List.findOne({name:customListName},function(err,foundList){
        if(!err){
          if(!foundList){

            const list=new List({
              name:customListName,
              reports:defaultReports
            });
            list.save();
    res.redirect("/"+customListName);
          }else{

        res.render("out",{TheDay:foundList.name,newReport:foundList.reports});
          }
        }
        else{
          res.redirect("/");
        }
      });
    }
    else{
      res.redirect("/");
    }
      });


  app.post("/thank",function(req,res){

    if (req.isAuthenticated()){
      const sname= req.body.sd;
      const del=req.body.delid;


    if(sname==="Today"){
      item.save();
      res.redirect("/");
    }else{
       console.log(del);
       console.log(sname);
      List.findOneAndUpdate({name:sname},{$pull:{reports:{_id:del}}},function(err,foundReport){

        if(!err){

          res.redirect("/out/"+sname);
        }
      });

    }


  }
  });





  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 3000;
  }



app.listen(port, function() {
  console.log("Server has started successfully.");
});
