var express = require("express"),
    mongoose = require("mongoose"),
    bodyParser = require("body-parser"),
    passport = require("passport"),
    localStrategy = require("passport-local"),
    app = express(),
    campGrounds = require("./models/campground"),
    Comment = require("./models/comment"),
    User = require("./models/user"),
    seedDB = require("./seed");

mongoose.connect("mongodb://localhost:27017/yelpCamp", { useNewUrlParser: true });


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Configuring Passport

app.use(require("express-session")({
    secret: "password",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.user = req.user;
    next();
})

/*===========================================RESTful routes===============================================*/

/*CAMPGROUND routes*/
app.get("/", function(req, res) {
    res.render("./landing");
});

app.get("/campgrounds", function(req, res) {
    campGrounds.find({}, function(err, camp) {
        if (err) {
            console.log("Failed to render!");
        }
        else {
            res.render("./campgrounds/index", { campSites: camp });
        }
    });
});

app.post("/campgrounds", isloggedin,function(req, res) {
    var name = req.body.name;
    var img = req.body.img;
    var desc = req.body.desc;
    campGrounds.create({
        name: name,
        img: img,
        desc: desc
    }, function(err, camp) {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect("/campgrounds");
        }
    });
});

app.get("/campgrounds/new", isloggedin, (req, res)=> {
    res.render("./campgrounds/new");
});

app.get("/campgrounds/:id", function(req, res) {
    campGrounds.findById(req.params.id).populate("comments").exec((err, u) => {
        if (err) {
            console.log("Commnets cant be populated!");
        }
        else {
            res.render("./campgrounds/show", { camp: u });
        }
    });
});

/*COMMENTS routes*/
app.get("/campgrounds/:id/comments/new", isloggedin, function(req, res) {
    campGrounds.findById(req.params.id, (err, campground) => {
        if (err) {
            console.log("Commnets cant be found!");
        }
        else {
            res.render("./comments/new", { camp: campground });
        }
    });
});
app.post("/campgrounds/:id/comments", isloggedin ,(req, res) => {
    campGrounds.findById(req.params.id).populate("comments").exec((err, ground) => {
        if (err) {
            console.log("Commnets cant be populated!");
        }
        else {
            Comment.create(req.body.comment, (err, comment) => {
                if (err) {
                    console.log(err);
                }
                else {
                    ground.comments.push(comment);
                    ground.save((err, camp) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            res.redirect("/campgrounds/" + ground._id);
                        }
                    });
                }
            })
        }
    });
})


/*AUTH routes*/

app.get("/register", function(req, res) {
    res.render("./user/register");
})

app.post("/register", function(req,res){
    User.register(new User({username : req.body.username}), req.body.password, (err,user)=>{
        if(err){
            console.log(err);
            return res.redirect("/register")
        }
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/campgrounds");
            })
        
    })
});

app.get("/login", function(req, res) {
    res.render("./user/login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect : "/campgrounds",
    failureRedirect : "/register"
}), (req,res)=>{
    
});
app.get("/logout", (req,res)=>{
    req.logout();
    res.redirect("/");
})
app.listen(process.env.PORT, process.env.IP, function() { console.log("Yelpcamp Server Started!") });


function isloggedin(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }else{
        res.redirect("/login");
    }
}