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
        agent: Object,
        created: {type:Date, default:Date.now}

    })

    var Loi = mongoose.model("Loi", loiSchema);


// =============
//   ROUTES
// =============

// Root path leads to index
app.get("/", isLoggedIn, function(req,res){
    res.redirect("/records");
})

// INDEX ROUTE

app.get("/records", isLoggedIn, function(req,res){
    Loi.find({agent: req.user}, function(err,lois){
        if (err) {
            console.log(err);
        } else {
            res.render('records', {lois: lois, moment: moment, numFormat: numFormat, numConverter: numConverter})
            console.log(req.user);
        }
    })
})

// SHOW FORM - CREATE NEW TERMS (GET)

app.get("/records/new", isLoggedIn, function(req,res) {
    res.render("new");
})


// EXECUTE - CREATE NEW TERMS (POST)
app.post("/records", isLoggedIn, function(req,res){

    req.body.opp.agent = req.user;
    console.log(req.body.opp);

    Loi.create(req.body.opp, function(err, newLoi){
        if (err) {
            res.render("new");
        } else {
            res.redirect("/records/"+newLoi._id+"/editnew");
            console.log(newLoi);
        }
    })
})


// SHOW RECORD

app.get("/records/:id", isLoggedIn, function(req,res){
    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records")
            console.log(err);
        } else {
            
            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                res.render("show", {loi:foundLoi})
            } else {
                res.send("You are not authorized to view this record.");
            }
        }
    })
})


// SHOW FORM - EDIT NEW TEXT (GET)
    app.get("/records/:id/editnew", isLoggedIn, function(req,res) {

        Loi.findById(req.params.id, function(err, foundLoi){
            if (err) {
                res.redirect("/records");
                console.log(err);
            } else {

                var     idFromFoundLoi = foundLoi.agent._id,
                        idFromRequest = req.user._id,
                        idLoiString = idFromFoundLoi.toString(),
                        idReqString = idFromRequest.toString();

                if (idLoiString == idReqString) {
                    res.render("edit", {loi:foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
                } else {
                    res.send("You are not authorized to view this record.");
                }    
            }
        })
    })


// EXECUTE - EDIT NEW TEXT (PUT)

app.put("/records/:id", isLoggedIn, function(req,res){
    
    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records/:id/update-terms");
            console.log(err);
        } else {

            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                
                Loi.findByIdAndUpdate(req.params.id, req.body.opp, {omitUndefined:true}, function(err, updateLoi){
                    if (err) {
                        res.redirect("/records");
                        console.log(err);
                    } else {
                        res.redirect("/records/"+req.params.id);
                        console.log('PUT executed');
                    }
                })

            } else {
                res.send("You are not authorized to modify this record.");
            }    
        }
    })

}) 

// SHOW FORM - UPDATE EXISTING TERMS (GET)

app.get("/records/:id/update-terms", isLoggedIn, function(req,res) {

    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records");
            console.log(err);
        } else {
            
            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                res.render("update-terms", {loi:foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
            } else {
                res.send("You are not authorized to view this record.");
            }    
        }
    })
})

// EXECUTE - UPDATE EXISTING TERMS (PUT)

app.put("/records/:id/update-terms", isLoggedIn, function(req,res){

    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records/:id/update-terms");
            console.log(err);
        } else {

            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                
                Loi.findByIdAndUpdate(req.params.id, req.body.opp, {omitUndefined:true}, function(err, updateLoi){
                    if (err) {
                        res.redirect("/records/"+req.params.id+"/update-terms");
                        console.log(err);
                    } else {
                        res.redirect("/records/"+req.params.id+"/edited-text");
                    }
                })            
            } else {
                res.send("You are not authorized to modify this record.");
            }    
        }
    })
}) 


// SHOW OUTPUT - EDITED TEXT AFTER TERMS UPDATE (GET)
app.get("/records/:id/edited-text", isLoggedIn, function(req,res) {

    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records/"+req.params.id+"/update-terms");
            console.log(err);
        } else {
            
            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                res.render("edited-text", {loi:foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
            } else {
                res.send("You are not authorized to view this record.");
            }    
        }
    })
})

// SHOW FORM - UPDATE EXISTING TEXT AFTER TERMS UPDATE (GET)
app.get("/records/:id/update-text", isLoggedIn, function(req,res) {

    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            console.log(err);
            res.redirect("/records/"+req.params.id+"/edited-text");
        } else {
            
            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                res.render("update-text", {loi:foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter})
            } else {
                res.send("You are not authorized to view this record.");
            }              
        }
    })
})


// GENERATE PDF

app.post("/records/:id/generate-pdf", isLoggedIn, function(req,res){

    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records/:id/update-terms");
            console.log(err);
        } else {

            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                
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

            } else {
                res.send("You are not authorized to access this record.");
            }    
        }
    })

})
    // // // // // // // 

// SHOW SIGN UP FORM
    app.get("/register", isLoggedIn, function(req,res){
        idFromRequest = req.user._id,
        idReqString = idFromRequest.toString();
        if (idReqString == "5dcbc12ba2ccd696827c78c5") {
         res.render("register")
        } else {
            res.send("<h1>You are not authorized to access this site.</h1>")
        }
    })

// CREATE USER SIGN UP
    app.post("/register", isLoggedIn, function(req,res){
        idFromRequest = req.user._id,
        idReqString = idFromRequest.toString();
        if (idReqString == "5dcbc12ba2ccd696827c78c5") {
            User.register(new User({username: req.body.username}), req.body.password, function(err,user){
                if (err) {
                    console.log(err);
                    return res.render("register");
                } else {
                    passport.authenticate("local")(req,res, function(){
                        res.redirect("/secret");
                    })
                }
            });
        }
    });

// LOGIN FORM
    app.get("/login", function(req,res){
        res.render("login");
    })

// POST LOG IN USER
    app.post("/login", passport.authenticate("local",{
        successRedirect:"/records",
        failureRedirect:"/login"
    }), function(req,res){
    })

// LOG OUT ROUTE
    app.get("/logout", function(req,res){
        req.logout();
        res.redirect("/")
    })

// FUNCTION: REQUIRE AUTHENTICATION
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