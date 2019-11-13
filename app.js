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
    moment                  = require('moment'),
    format                  = require('format-number'),
    numConverter            = require('number-to-words'),
    Api2Pdf                 = require('api2pdf'),   
    
    a2pClient               = new Api2Pdf('1d3eeb76-f00f-42e9-b265-0a2925c28690'),
    numFormat               = format({integerSeparator: ',', prefix: 'S$'}),
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
    mongoose.connect("mongodb+srv://jlsm:lk4577@cluster0-xu9pt.mongodb.net/test?retryWrites=true&w=majority");

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
// EXPORTING DATE CAPABILITY

    // exports.index = function(req, res) {
    //     res.render('edit', { moment: moment });
    // }

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
        bank: String,
        account: String,
        startDate: Date,
        fullText: String,
        created: {type:Date, default:Date.now}
    })

    var Loi = mongoose.model("Loi", loiSchema);


// =============
//   ROUTES
// =============

// Root path leads to index
app.get("/", function(req,res){
    res.redirect("/records");
})

// INDEX ROUTE

app.get("/records", function(req,res){
    Loi.find({}, function(err,lois){
        if (err) {
            console.log(err);
        } else {
            res.render('records', {lois: lois, moment: moment, numFormat: numFormat, numConverter: numConverter})
        }
    })
})

// SHOW FORM - CREATE NEW TERMS (GET)

app.get("/records/new", function(req,res) {
    res.render("new");
})


// EXECUTE - CREATE NEW TERMS (POST)
app.post("/records", function(req,res){
    
    Loi.create(req.body.opp, function(err, newLoi){
        if (err) {
            res.render("new");
        } else {
            res.redirect("/records/"+newLoi._id+"/editnew");
            // res.redirect('edit', {loi: newLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
        }
    })
})


// SHOW RECORD

app.get("/records/:id", function(req,res){
    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records")
        } else {
            res.render("show", {loi:foundLoi})
        }
    })
})


// SHOW FORM - EDIT NEW TEXT (GET)
    app.get("/records/:id/editnew", function(req,res) {

        Loi.findById(req.params.id, function(err, foundLoi){
            if (err) {
                res.redirect("/records");
            } else {
                res.render("edit", {loi:foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
            }
        })
    })


// EXECUTE - EDIT NEW TEXT (PUT)

app.put("/records/:id", function(req,res){

    Loi.findByIdAndUpdate(req.params.id, req.body.opp, {omitUndefined:true}, function(err, updateLoi){
        if (err) {
            res.redirect("/records");
            console.log(err);
        } else {
            res.redirect("/records/"+req.params.id);
            console.log('PUT executed');
        }
    })


}) 

// SHOW FORM - UPDATE EXISTING TERMS (GET)

app.get("/records/:id/update-terms", function(req,res) {
    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records");
            console.log(err);
        } else {
            res.render("update-terms", {loi:foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
        }
    })
})

// EXECUTE - UPDATE EXISTING TERMS (PUT)

app.put("/records/:id/update-terms", function(req,res){

    Loi.findByIdAndUpdate(req.params.id, req.body.opp, {omitUndefined:true}, function(err, updateLoi){
        if (err) {
            res.redirect("/records/"+req.params.id+"/update-terms");
            console.log(err);
        } else {
            res.redirect("/records/"+req.params.id+"/edited-text");
        }
    })
}) 


// SHOW OUTPUT - EDITED TEXT AFTER TERMS UPDATE (GET)
app.get("/records/:id/edited-text", function(req,res) {

    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records/"+req.params.id+"/update-terms");
            console.log(err);
        } else {
            res.render("edited-text", {loi:foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
        }
    })
})

// SHOW FORM - UPDATE EXISTING TEXT AFTER TERMS UPDATE (GET)
app.get("/records/:id/update-text", function(req,res) {

    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            console.log(err);
            res.redirect("/records/"+req.params.id+"/edited-text");
        } else {
            res.render("update-text", {loi:foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
        }
    })
})


// GENERATE PDF

app.post("/generate-pdf", function(req,res){

    // Save FullText to MongoDB
    Loi.findByIdAndUpdate(req.params.id, req.body.opp, {omitUndefined:true}, function(err, updateLoi){
        if (err) {
            console.log(err);
        } else {
            console.log('PUT executed');
        }
    })

    // Convert HTML to PDF with Headless Chrome
    var htmlToConvert = req.body.opp.fullText;

    a2pClient.headlessChromeFromHtml(htmlToConvert).then(function(result) {
        console.log(result);
        pdfWeb = result.pdf;
        res.redirect(pdfWeb);
    });

})


    // // // // // // // 


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