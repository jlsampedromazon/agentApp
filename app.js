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
	hellosign				= require('hellosign-sdk')({ key: '3438d68cdac5912219bdec06347561eed78279a42925fc7aafc40ee8b8e22873' }),
    
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

	// Create Agent Schema, including user details
	var agentSchema = new mongoose.Schema({
		salutation: String,
		fullName: String,
		company: String,
		username: String,
		password: String,
		image: String
	})

	var Agent = mongoose.model("Agent", agentSchema);

	
// =============
//   ROUTES
// =============

// Root path leads to index
app.get("/", isLoggedIn, function(req,res){
    res.redirect("/records");
})

// INDEX ROUTE

app.get("/records", isLoggedIn, function(req,res){
	console.log(req.user);

    Loi.find({agent: req.user}, function(err,lois){
        if (err) {
            console.log(err);
        } else {
            Agent.findOne({username: req.user.username}, function (err, foundAgent){
				if (err) {
					console.log(err)
				} else {
					res.render('records', {lois: lois, foundAgent:foundAgent, moment: moment, numFormat: numFormat, numConverter: numConverter});
				}
			})
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
                        res.redirect("/records");
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
                    var pdfWeb = result.pdf;
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
        if (idReqString == "5dcd3c65d9e92f123992d2c0") {
         res.render("register")
        } else {
            res.send("<h1>You are not authorized to access this site.</h1>")
        }
    })

// CREATE USER SIGN UP
    app.post("/register", isLoggedIn, function(req,res){
		
		// // Check that user is the admin
		idFromRequest = req.user._id,
		idReqString = idFromRequest.toString();
		
		// 	If user is admin...	
		if (idReqString == "5dcd3c65d9e92f123992d2c0") {
			
			// 	Register a new user for authentication purposes		
            User.register(new User({username: req.body.username}), req.body.password, function(err,user){
                if (err) {
                    console.log(err);
                    return res.render("register");
                } else {
					// Create a new agent profile for the record 					
					Agent.create(req.body, function(err, newLoi){
						if (err) {
							res.render("register");
						} else {
							res.send("<h1>SUCCESS!</h1>")
						}
					})
				}	
            });
		} else {
			res.send("You are not authorized to access this record.");
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
        if(req.isAuthenticated()){
            return next();
        } else {
        res.redirect("/login");
         }}

// HELLOSIGN CALLBACKS

         app.post("/hellosign", function(req,res){
             console.log(req.body);
             res.send("Hello API Event Received");
         })


// SHOW FORM - E-SIGN (POST bc it saves the file)

app.post("/records/:id/esigndetails", isLoggedIn, function(req,res) {
	
	// 	Check user is authorized
    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            res.redirect("/records/"+req.params.id);
            console.log(err);
        } else {
            
            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString();
			
			// If user is authorized...
            if (idLoiString == idReqString) {
				
				// Save FullText to MongoDB
                Loi.findByIdAndUpdate(req.params.id, req.body.opp, {omitUndefined:true}, function(err, updateLoi){
                    if (err) {
                        console.log(err);
						res.redirect("/records/"+req.params.id)
                    } else {
                        console.log('PUT executed');
						res.render("eSignForm", {loi:foundLoi});
                    }
                })
                
            } else {
                res.send("You are not authorized to view this record.");
            }    
        }
    })
})



// EXECUTE - E-SIGN

app.post("/records/:id/esign", isLoggedIn, function(req,res){
	
	// Check if user is authorized 	
    Loi.findById(req.params.id, function(err, foundLoi){
        if (err) {
            console.log(err);
			res.redirect("/records/" + foundLoi._id +"/esign");
        } else {

            var     idFromFoundLoi = foundLoi.agent._id,
                    idFromRequest = req.user._id,
                    idLoiString = idFromFoundLoi.toString(),
                    idReqString = idFromRequest.toString(),
				
					agentUsername = req.user.username;
			
			// 	If the user is authorized...		
            if (idLoiString == idReqString) {

                // Convert HTML to PDF with Headless Chrome
                var htmlToConvert = req.body.opp.fullText;

                a2pClient.headlessChromeFromHtml(htmlToConvert).then(function(result) {
                    console.log(result);
                    var pdfWeb = result.pdf;
					
				// 	Prepare eSignature email workflow
					
					Agent.findOne({username: agentUsername}, function(err, foundAgent){
						if (err) {
							console.log(err);
							res.redirect("/records/" + foundLoi._id +"/esign");
						} else {
							const opts = {
							  test_mode: 0,
							  clientId: 'b76c446c7b80c2faf32eb4d8cee91f8e',
							  subject: 'Tenancy LOI for ' + foundLoi.address,
							  message: 'Kindly sign the LOI in relation to the tenancy of '+ foundLoi.address,
							  signers: [

								{
								 	email_address: req.body.tenantEmail ,
								  	name: "M. " + foundLoi.tenantName,
									order: 1
								},

								{
									email_address: foundAgent.username,
									name: "M. " + foundAgent.fullName,
									order: 0
								},

								{
									email_address: req.body.landlordEmail,
									name: "M. " + foundLoi.landlordName,
									order: 2
								}

							  ],
							  cc_email_addresses: ['operations@lexknights.com'],
							use_text_tags: 1,
							hide_text_tags: 1,
							signing_options: {
								"draw": true,
								"type":true,
								"upload": true,
								"phone": false,
								"default":"draw"
							},
							file_url: [pdfWeb]
							};
							
							// 	Run HelloSign Email Workflow
					
							hellosign.signatureRequest.send(opts).then((hellores) => {
								console.log(hellores);
								res.redirect("/records");
								// hellosign.signatureRequest.get(signatureRequestId).then((sigStatusRes) => {
								//   console.log(sigStatusRes);
								// }).catch((err) => {
								//   console.log(err);
								// })
							}).catch((err) => {
							  	console.log(err);
								res.redirect("/records/" + foundLoi._id +"/esign");
							});
							
						}
					})
				}).catch((err) => {
					console.log(err);
					res.redirect("/records/" + foundLoi._id +"/esign")
				});
	
            } else {
                res.send("You are not authorized to access this record.");
            }    
        }
    })

})

app.get("/privacy", function(req,res){
	res.render("privacy");
})

app.get("/terms", function(req, res){
	res.render("terms");
})

app.get("/test", function(req, res){
	res.render("index");
})

app.get("/join", function(req, res){
	res.render("join");
})

// HELLOSIGN GET PAGE

//          app.get("/hellosign", function(req,res){
// 			const opts = {
// 			  test_mode: 1,
// 			  clientId: 'b76c446c7b80c2faf32eb4d8cee91f8e',
// 			  subject: 'The LOI we talked about',
// 			  message: 'Please sign this NDA and then we can discuss more.',
// 			  signers: [
// 				{
// 				  email_address: 'jose.sampedro@lexknights.com',
// 				  name: 'Jose'
// 				}
// 			  ],
// 			  files: ['sampleLoi.pdf']
// 			};
			 
// 			hellosign.signatureRequest.createEmbedded(opts).then((hellores) => {
// 			  const signature = hellores.signature_request.signatures[0];
// 			  const signatureId = signature.signature_id;
// 			  return hellosign.embedded.getSignUrl(signatureId);
// 			}).then((hellores) => {
// 			  	console.log('The sign url: ' + hellores.embedded.sign_url);
// 				res.render("hellosign", {eSigURL: hellores.embedded.sign_url});
// 			}).catch((err) => {
// 			  console.log(err);
// 			});
//          })

// =============
//   SERVER
// =============

// Init Server
    app.listen(process.env.PORT || 3000, process.env.IP, function(){
        console.log("Server Initialized!");
    });