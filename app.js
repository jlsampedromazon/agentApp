// REQUIRE LIBRARIES & MODULES

var express                 = require('express'),
    mongoose                = require('mongoose'),
    bodyParser              = require('body-parser'),
    passport                = require('passport'),
    LocalStrategy           = require('passport-local'),
    passportLocalMongoose   = require('passport-local-mongoose'),
    User                    = require('./models/user'),
    Joiner                  = require('./models/joiner'),
    Loi                     = require('./models/loi'),
    Agent                   = require('./models/agent'),
    methodOverride          = require("method-override"),
    sanitizer               = require("express-sanitizer"),
    moment                  = require('moment'),
    format                  = require('format-number'),
    numConverter            = require('number-to-words'),
    Api2Pdf                 = require('api2pdf'),
    hellosign               = require('hellosign-sdk')({ key: '3438d68cdac5912219bdec06347561eed78279a42925fc7aafc40ee8b8e22873' }),
    nodemailer              = require('nodemailer')

    a2pClient               = new Api2Pdf('1d3eeb76-f00f-42e9-b265-0a2925c28690'),
    numFormat               = format({ integerSeparator: ',', prefix: 'S$' }),
    app                     = express();

// CONFIG EXPRESS

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(methodOverride("_method"));
app.use(sanitizer());
app.use(bodyParser.urlencoded({ extended: true }));

// CONFIG MONGOOSE

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb+srv://jlsm:lk4577@cluster0-xu9pt.mongodb.net/test?retryWrites=true&w=majority");

// CONFIG AUTHENTICATION

app.use(require("express-session")({
    secret: "mooncakes are yummy",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
})

// CONFIG NODEMAILER

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'jlsampedromazon@gmail.com',
        pass: 'kxtvlwqysnbjcbeh'
    }
});

var internalNotifications = {
    from: 'operations@lexknights.com',
    to: 'operations@lexknights.com',
    subject: 'DealPro: Internal Notification',
    text: 'You have an internal notification'
};

// =============
//   ROUTES
// =============


// GET LANDING PAGE
app.get("/", function (req, res) {
    res.render("index");
})


// GET INDEX (RECORDS) 

app.get("/records", isLoggedIn, function (req, res) {
    console.log(req.user);

    // Find all LOIs created by the relevant user
    Loi.find({ agent: req.user }, function (err, lois) {
        if (err) {
            console.log(err);
            adminNotification("Error", err, "GET Records - LOI not found");
            res.redirect("/");
        } else {
            // Find agent salutation and full name to display on records dashboard
            Agent.findOne({ username: req.user.username }, function (err, foundAgent) {
                if (err) {
                    console.log(err)
                    adminNotification("Error", err, "GET Records - Agent not found");
                    res.redirect("/");
                } else {
                    res.render('records', { lois: lois, foundAgent: foundAgent, moment: moment, numFormat: numFormat, numConverter: numConverter });
                }
            })
        }
    })
})


// GET FORM TO INPUT NEW TERMS AND CREATE NEW LOI (WITHOUT MAIN TEXT)

app.get("/records/new", isLoggedIn, function (req, res) {
    res.render("new");
})


// POST TERMS TO CREATE NEW LOI (WITHOUT MAIN TEXT)

app.post("/records", isLoggedIn, function (req, res) {

    // Prepares to add agent name and ID to LOI record
    req.body.opp.agent = req.user;
    console.log(req.body.opp);

    // Creates new LOI with key terms & agent (but leaves out text)
    Loi.create(req.body.opp, function (err, newLoi) {
        if (err) {
            res.render("new");
            console.log(err);
            adminNotification("Error", err, "POST LOI Terms - Failed to create LOI");
        } else {
            res.redirect("/records/" + newLoi._id + "/editnew");
            console.log(newLoi);
            adminNotification("Event", newLoi, "POST LOI Terms - New LOI Created");
        }
    })
})


// GET TEXT EDITOR TO RENDER, EDIT AND SAVE MAIN TEXT OF NEW LOI

app.get("/records/:id/editnew", isLoggedIn, function (req, res) {
    // Find LOI and extract agent details to first check is agent is the author
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            res.redirect("/records");
            console.log(err);
            adminNotification("Error", err, "GET New LOI on Text Editor - Failed to Find LOI");
        } else {
            // Compare user credentials with LOI author (first need to convert obj into str)
            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();
            // Render main text of LOI in text editor to finalize & save if agent is the author, otherwise don't allow
            if (idLoiString == idReqString) {
                // Find agent details and pass them to edit.ejs to populate agent signature block in LOI
                Agent.findOne({ username: req.user.username }, function (err, foundAgent) {
                    if (err) {
                        console.log(err)
                        adminNotification("Error", err, "GET Records - Agent not found");
                        res.redirect("/");
                    } else {
                        res.render("edit", { loi: foundLoi, agent: foundAgent, moment: moment, numFormat: numFormat, numConverter: numConverter });
                    }
                })
                
            } else {
                res.send("You are not authorized to view this record.");
            }
        }
    })
})


// GET DETAILS OF SELECTED RECORD

app.get("/records/:id", isLoggedIn, function (req, res) {
    // Find LOI and extract agent details to first check is agent is the author
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            res.redirect("/records")
            console.log(err);
            adminNotification("Error", err, "GET Selected LOI Record - Failed to Find LOI");

        } else {
            // Compare user credentials with LOI author (first need to convert obj into str)
            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();
            // Show LOI if agent is the author, otherwise don't allow
            if (idLoiString == idReqString) {
                res.render("show", { loi: foundLoi })
            } else {
                res.send("You are not authorized to view this record.");
            }
        }
    })
})


// PUT UPDATE WITH MAIN TEXT FOR NEW OR EXISTING LOI 

app.put("/records/:id", isLoggedIn, function (req, res) {
    // Find LOI and extract agent details to first check is agent is the author
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            res.redirect("/records/:id/update-terms");
            console.log(err);
            adminNotification("Error", err, "PUT LOI Update  - Failed to Find LOI");

        } else {
            // Compare user credentials with LOI author (first need to convert obj into str)
            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                // Update record without overwritting null on unsubmitted fields (i.e. key terms)
                Loi.findByIdAndUpdate(req.params.id, req.body.opp, { omitUndefined: true }, function (err, updateLoi) {
                    if (err) {
                        res.redirect("/records");
                        console.log(err);
                        adminNotification("Error", err, "PUT LOI Update  - Failed to Update LOI");
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


// GET FORM TO UPDATE EXISTING LOI TERMS 

app.get("/records/:id/update-terms", isLoggedIn, function (req, res) {
    // Find LOI and extract agent details to first check is agent is the author
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            res.redirect("/records");
            console.log(err);
            adminNotification("Error", err, "GET Form to Update LOI Terms  - Failed to Find LOI");
        } else {
            // Compare user credentials with LOI author (first need to convert obj into str)
            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();
            // Render form with pre-loaded values for exiting terms allowing user to modify or keep
            if (idLoiString == idReqString) {
                res.render("update-terms", { loi: foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter })
            } else {
                res.send("You are not authorized to view this record.");
            }
        }
    })
})


// PUT UPDATED TERMS FOR EXISTING LOI

// [NOTE: This path re-directs back to update-terms upon error, unlike main text PUT]
app.put("/records/:id/update-terms", isLoggedIn, function (req, res) {
    // Find LOI and extract agent details to first check is agent is the author
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            res.redirect("/records/:id/update-terms");
            console.log(err);
            adminNotification("Error", err, "PUT Updated Terms for Existing LOI  - Failed to Find LOI");

        } else {
            // Compare user credentials with LOI author (first need to convert obj into str)
            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {
                
                // Update record without overwritting null on unsubmitted fields (i.e. main text)
                Loi.findByIdAndUpdate(req.params.id, req.body.opp, { omitUndefined: true }, function (err, updateLoi) {
                    if (err) {
                        res.redirect("/records/" + req.params.id + "/update-terms");
                        console.log(err);
                        adminNotification("Error", err, "PUT Updated Terms for Existing LOI  - Failed to Update LOI");
                    } else {
                        res.redirect("/records/" + req.params.id + "/edited-text");
                    }
                })
            } else {
                res.send("You are not authorized to modify this record.");
            }
        }
    })
})


// GET VIEW OF MAIN TEXT AFTER KEY TERMS OF EXITING LOI HAVE BEEN EDITED

// Front-end JS used to render main text with updated terms, then offer to save or actually edit main text (mainly bc front-end JS did not work inside TinyMCE, but also minimizes calls to it)
app.get("/records/:id/edited-text", isLoggedIn, function (req, res) {
    // Find LOI and extract agent details to first check is agent is the author
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            res.redirect("/records/" + req.params.id + "/update-terms");
            console.log(err);
            adminNotification("Error", err, "GET Main Text After Updating Key LOI Terms - Failed to Find LOI");
        } else {
            // Compare user credentials with LOI author (first need to convert obj into str)
            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();
            // Show view of edited text in html reflecting updates to key terms
            if (idLoiString == idReqString) {
                res.render("edited-text", { loi: foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter })
            } else {
                res.send("You are not authorized to view this record.");
            }
        }
    })
})

// GET TEXT EDITOR TO EDIT AND SAVE MAIN TEXT OF EXISTING LOI AFTER TERMS UPDATE

// [NOTE: This path re-directs back to view of updated main text upon error, unlike main text PUT]
app.get("/records/:id/update-text", isLoggedIn, function (req, res) {
    // Find LOI and extract agent details to first check is agent is the author
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            console.log(err);
            res.redirect("/records/" + req.params.id + "/edited-text");
            adminNotification("Error", err, "GET Text Editor for Existing LOI Post-Terms Update - Failed to Find LOI");
        } else {
            // Compare user credentials with LOI author (first need to convert obj into str)
            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();
            // Render main text of updated LOI in text editor for user to edit & save
            if (idLoiString == idReqString) {
                res.render("update-text", { loi: foundLoi, moment: moment, numFormat: numFormat, numConverter: numConverter })
            } else {
                res.send("You are not authorized to view this record.");
            }
        }
    })
})


//  CLEANUP CHECKPOINT: 26 NOV ****************************


// GENERATE PDF

app.post("/records/:id/generate-pdf", isLoggedIn, function (req, res) {

    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            res.redirect("/records/:id/update-terms");
            console.log(err);
        } else {

            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();

            if (idLoiString == idReqString) {

                // Save FullText to MongoDB
                Loi.findByIdAndUpdate(req.params.id, req.body.opp, { omitUndefined: true }, function (err, updateLoi) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('PUT executed');
                    }
                })

                // Convert HTML to PDF with Headless Chrome
                var htmlToConvert = req.body.opp.fullText;

                a2pClient.headlessChromeFromHtml(htmlToConvert).then(function (result) {
                    console.log(result);
                    var pdfWeb = result.pdf;
                    res.redirect(pdfWeb);
                });
                // Send Internal Notification
                var strLOI = JSON.stringify(foundLoi);
                internalNotifications.text = strLOI;
                internalNotifications.subject = "DealPro: PDF of LOI Generated";
                transporter.sendMail(internalNotifications, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            } else {
                res.send("You are not authorized to access this record.");
            }
        }
    })

})
// // // // // // // 

// SHOW SIGN UP FORM
app.get("/register", isLoggedIn, function (req, res) {
    idFromRequest = req.user._id,
        idReqString = idFromRequest.toString();
    if (idReqString == "5dcd3c65d9e92f123992d2c0") {
        res.render("register")
    } else {
        res.send("<h1>You are not authorized to access this site.</h1>")
    }
})

// CREATE USER SIGN UP
app.post("/register", isLoggedIn, function (req, res) {

    // // Check that user is the admin
    idFromRequest = req.user._id,
        idReqString = idFromRequest.toString();

    // 	If user is admin...	
    if (idReqString == "5dcd3c65d9e92f123992d2c0") {

        // 	Register a new user for authentication purposes		
        User.register(new User({ username: req.body.username }), req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render("register");
            } else {
                // Create a new agent profile for the record 					
                Agent.create(req.body, function (err, newLoi) {
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
app.get("/login", function (req, res) {
    res.render("login");
})


// POST LOG IN USER
app.post("/login", passport.authenticate("local", {
    // successRedirect: "/records",
    failureRedirect: "/login"
}), function (req, res) {
    res.redirect("/records");
    // Send Internal Notification
    var strlogin = JSON.stringify(req.body);
    internalNotifications.text = strlogin;
    internalNotifications.subject = "DealPro: User Logged-In";
    transporter.sendMail(internalNotifications, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

})


// LOG OUT ROUTE
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/")
})


// HELLOSIGN CALLBACKS

app.post("/hellosign", function (req, res) {
    console.log(req.body);
    res.send("Hello API Event Received");
})


// SHOW FORM - E-SIGN (POST bc it saves the file)

app.post("/records/:id/esigndetails", isLoggedIn, function (req, res) {

    // 	Check user is authorized
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            res.redirect("/records/" + req.params.id);
            console.log(err);
        } else {

            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString();

            // If user is authorized...
            if (idLoiString == idReqString) {

                // Save FullText to MongoDB
                Loi.findByIdAndUpdate(req.params.id, req.body.opp, { omitUndefined: true }, function (err, updateLoi) {
                    if (err) {
                        console.log(err);
                        res.redirect("/records/" + req.params.id)
                    } else {
                        console.log('PUT executed');
                        res.render("eSignForm", { loi: foundLoi });
                    }
                })

            } else {
                res.send("You are not authorized to view this record.");
            } 
        }
    })
})


// EXECUTE - E-SIGN

app.post("/records/:id/esign", isLoggedIn, function (req, res) {

    // Check if user is authorized 	
    Loi.findById(req.params.id, function (err, foundLoi) {
        if (err) {
            console.log(err);
            res.redirect("/records/" + foundLoi._id + "/esign");
        } else {

            var idFromFoundLoi = foundLoi.agent._id,
                idFromRequest = req.user._id,
                idLoiString = idFromFoundLoi.toString(),
                idReqString = idFromRequest.toString(),

                agentUsername = req.user.username;

            // 	If the user is authorized...		
            if (idLoiString == idReqString) {

                // Convert HTML to PDF with Headless Chrome
                var htmlToConvert = req.body.opp.fullText;

                a2pClient.headlessChromeFromHtml(htmlToConvert).then(function (result) {
                    console.log(result);
                    var pdfWeb = result.pdf;

                    // 	Prepare eSignature email workflow

                    Agent.findOne({ username: agentUsername }, function (err, foundAgent) {
                        if (err) {
                            console.log(err);
                            res.redirect("/records/" + foundLoi._id + "/esign");
                        } else {
                            const opts = {
                                test_mode: 0,
                                clientId: 'b76c446c7b80c2faf32eb4d8cee91f8e',
                                subject: 'Tenancy LOI for ' + foundLoi.address,
                                message: 'Kindly sign the LOI in relation to the tenancy of ' + foundLoi.address,
                                signers: [

                                    {
                                        email_address: req.body.tenantEmail,
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
                                    "type": true,
                                    "upload": true,
                                    "phone": false,
                                    "default": "draw"
                                },
                                file_url: [pdfWeb]
                            };

                            // 	Run HelloSign Email Workflow

                            hellosign.signatureRequest.send(opts).then((hellores) => {
                                console.log(hellores);
                                res.redirect("/records");
                            }).catch((err) => {
                                console.log(err);
                                res.redirect("/records/" + foundLoi._id + "/esign");
                            });

                            // Send Internal Notification
                            var strLOI = JSON.stringify(foundLoi);
                            internalNotifications.text = strLOI;
                            internalNotifications.subject = "DealPro: eSig of LOI Requested";
                            transporter.sendMail(internalNotifications, function (error, info) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Email sent: ' + info.response);
                                }
                            });

                        }
                    })
                }).catch((err) => {
                    console.log(err);
                    res.redirect("/records/" + foundLoi._id + "/esign")
                });

            } else {
                res.send("You are not authorized to access this record.");
            }
        }
    })

})

app.get("/privacy", function (req, res) {
    res.render("privacy");
})

app.get("/terms", function (req, res) {
    res.render("terms");
})

app.get("/test", function (req, res) {
    res.render("index");
})

app.get("/join", function (req, res) {
    res.render("join");
})

// REQUEST TO JOIN
app.post("/join", function (req, res) {

    // Create a new agent profile for the record 					
    Joiner.create(req.body, function (err, newJoiner) {
        if (err) {
            res.render("register");
        } else {
            res.send("<h1>SUCCESS!</h1>");
            var strJoiner = JSON.stringify(newJoiner);
            internalNotifications.text = strJoiner;
            internalNotifications.subject = "DealPro: New Joiner Request";
            transporter.sendMail(internalNotifications, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        }
    })
})

// =============
//   FUNCTIONS
// =============

// REQUIRE AUTHENTICATION

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect("/login");
    }
}

// EMAIL NOTIFICATION - ERROR

function adminNotification(type, obj, origin) {
    var strObject = JSON.stringify(obj);
    internalNotifications.text = strObject;
    internalNotifications.subject = "DealPro: " + type + " Notification - " + origin;
    transporter.sendMail(internalNotifications, function (err, info) {
        if (err) {
            console.log(err);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}


// EMAIL NOTIFICATION - USER EVENT
function notifyUserEvent(obj, origin) {
    var strObject = JSON.stringify(obj);
    internalNotifications.text = strObject;
    internalNotifications.subject = "DealPro: Event Notification - " + origin;
    transporter.sendMail(internalNotifications, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

// =============
//   SERVER
// =============

// Init Server
app.listen(process.env.PORT || 3000, process.env.IP, function () {
    console.log("Server Initialized!");
});


// ***************************** TECHNICAL DEBT - OUTSTANDING POINTS ***************************

// * CAN WE USE ONE PUT ROUTE FOR ALL UPDATES TO EXISTING LOI ENTRIES - I.E. NEW TEXT, UPDATE TERMS, EXISTING TEXT EDIT?

// * CAN WE USE ONE TEXT EDITOR VIEW FOR BOTH TEXT EDIT OF NEW AND EXISTING LOI'S?

// * SHOULD WE FIND ALTERNATIVE TO MAKE FLOW CONSISTENT ON UPDATE - I.E. UDPATE TERMS THEN UDPATE TEXT THEN RECORDS?

// * 