// REQUIRE LIBRARIES & MODULES
var express                 = require('express'),
    mongoose                = require('mongoose'),
    bodyParser              = require('body-parser'),
    passport                = require('passport'),
    LocalStrategy           = require('passport-local'),
    passportLocalMongoose   = require('passport-local-mongoose'),
    User                    = require('./models/user'),
    methodOverride          = require ("method-override"),
    sanitizer               = require("express-sanitizer"),
    
    app                     = express();

// EXPRESS CONFIG

    app.set("view engine", "ejs");
    app.use(express.static('public'));
    app.use(methodOverride("_method"));
    app.use(sanitizer());
    app.use(bodyParser.urlencoded({extended:true}));

// SET UP MONGOOSE
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);
    mongoose.connect("mongodb+srv://jlsm:lk4577@cluster0-xu9pt.mongodb.net/test?retryWrites=true&w=majority")

// TRIGGER AUTHENTICATION LIBRARIES

    app.use(require("express-session")({
        secret:"mooncakes are yummy",
        resave: false,
        saveUninitialized:false
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.use(function(req,res,next){
        res.locals.currentUser = req.user;
        next();
    })

// =============
//   DB SCHEMAS
// =============

    // Create LOI Input Schema
    var loiSchema = new mongoose.Schema({
        address: String,
        landlordName: String,
        tenantName: String,
        landlordId: String,
        tenantId: String,
        rentAmount: String,
        leasePeriod: String,
        diplo: String,
        created: {type:Date, default:Date.now}
    })

    var Loi = mongoose.model("Loi", loiSchema);

// =============
//   ROUTES
// =============


// INDEX ROUTE
    app.get("/", function(req,res) {
        res.render("new");
    })

// NEW ROUTE - save input from new entry form show me all content again
app.post("/edit", function(req,res){
    // Create Loi
        console.log(req.body);
        // Loi.create(req.body.blog, function(err, newBlog){
        //     if (err) {
        //         res.render("new");
        //     } else {
        //         res.redirect("blogs");
        //     }
        // })
})













// SECRET ROUTE
    app.get("/secret", isLoggedIn, function(req,res) {
        res.render("secret");
    })

// SHOW SIGN UP FORM
    app.get("/register", function(req,res){
        res.render("register")
    })

// CREATE USER SIGN UP
    app.post("/register", function(req,res){
        User.register(new User({username: req.body.username}), req.body.password, function(err,user){
            if (err) {
                console.log(err);
                return res.render("register");
            } else {
                passport.authenticate("local")(req,res, function(){
                    res.redirect("/secret");
            })}
        });
    });

// LOGIN FORM
    app.get("/login", function(req,res){
        res.render("login");
    })

// POST LOG IN USER
    app.post("/login", passport.authenticate("local",{
        successRedirect:"/secret",
        failureRedirect:"/login"
    }), function(req,res){
    })

// LOG OUT ROUTE
    app.get("/logout", function(req,res){
        req.logout();
        res.redirect("/")
    })

// Block Secret Page
    function isLoggedIn(req,res,next){
        console.log(req.isAuthenticated());
        if(req.isAuthenticated()){
            return next();
        } else {
        res.redirect("/login");
         }}


// =============
//   SERVER
// =============

// Init Server
    app.listen(process.env.PORT || 3000, process.env.IP, function(){
        console.log("Server Initialized!");
    });