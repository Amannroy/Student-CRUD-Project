const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const port = 3005;
const mysql = require("./connection").con

const hbs = require("hbs");

hbs.registerHelper("ifCond", function (v1, operator, v2, options) {
    switch (operator) {
        case "===":
            return v1 === v2 ? options.fn(this) : options.inverse(this);
        case "!==":
            return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case "<":
            return v1 < v2 ? options.fn(this) : options.inverse(this);
        case "<=":
            return v1 <= v2 ? options.fn(this) : options.inverse(this);
        case ">":
            return v1 > v2 ? options.fn(this) : options.inverse(this);
        case ">=":
            return v1 >= v2 ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});




// Configuration
app.set("view engine", "hbs")
app.set("views", "./view")
app.use(express.static(__dirname + "/public"))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use(session({
    secret: "ryshfthj",
    resave: true,
    saveUninitialized: true
}))


// Middleware to check if the user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        // User is logged in, proceed to the next middleware
        next();
    } else {
        // User is not logged in, redirect to the login page
        res.redirect('/login');
    }
};

// Middleware to redirect to '/index' if the user is logged in
const isLoggedInRedirectToIndex = (req, res, next) => {
    if (req.session.user) {
        res.redirect('/index');
    } else {
        // User is not logged in, proceed to the next middleware
        next();
    }
};


// Route for the /index page
app.get("/index", isLoggedIn, (req, res) => {
    res.render("index");
});





// Routing
app.get("/", (req, res) => {
    res.render("homepage");
});

app.get('/index', isLoggedInRedirectToIndex, (req, res) => {
    // This route will only be accessible if the user is logged in, and it will redirect to '/index'
    res.render('index');
});




// Other routes with authentication checks
app.get("/add", isLoggedIn, (req, res) => {
    res.render("add");
});

app.get("/search", isLoggedIn, (req, res) => {
    res.render("search");
});

  
  
  
  
  
  
  
  

  
app.get("/update", (req, res) => {
   res.render("update");

});
app.get("/delete", (req, res) => {
   res.render("delete");

});
app.get("/view", (req, res) => {
   let qry = "select * from student";
  mysql.query(qry, (err, results) => {
      if(err) throw err
      else {
      res.render("view", { data: results })
      }
  })

});
app.get("/addstudent", (req,res) => {
  // fetching data from form
  const { name, phone, email, gender } = req.query;




  // Sanitization (Prevent from XXS attacks)
  let qry = "select * from student where email=? or phone=?";
  mysql.query(qry, [email,phone], (err, results) => {
    if(err)
    throw err
   else{
      if (results.length > 0){
         res.render("add",{ checkmesg: true })
           
      }
      else{
             // Insert query
             let qry2 = "insert into student values(?,?,?,?)"
             mysql.query(qry2, [name, phone,email, gender], (err,results) => {
               if(results.affectedRows > 0){
                  res.render("add", { mesg: true })
               }
             })
      }
   }
  })
})

app.get("/searchstudent", (req, res) => {
   // fetch data from the form
   const { phone } = req.query;

   let qry = "select * from student where phone=?";
   mysql.query(qry, [phone], (err, results) => {
       if (err) throw err
       else {
           if (results.length > 0) {
               res.render("search", { mesg1: true, mesg2: false })
           } else {

               res.render("search", { mesg1: false, mesg2: true })

           }

       }
   });
})





app.get("/updatesearch", (req, res) => {
    const { phone } = req.query;
 
    let qry = "SELECT * FROM student WHERE phone=?";
    mysql.query(qry, [phone], (err, results) => {
       if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
          return;
       }
 
       if (results.length > 0) {
          res.render("update", { mesg1: true, mesg2: false, data: results });
       } else {
          res.render("update", { mesg1: false, mesg2: true });
       }
    });
 });
 
 app.post("/updatestudent", (req, res) => {
    const { phone, name, gender, email } = req.body; // Assuming you are using body-parser middleware for parsing form data
 
    let qry = "UPDATE student SET name=?, gender=?, email=? WHERE phone=?";
 
    mysql.query(qry, [name, gender, email, phone], (err, results) => {
       if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
          return;
       }
 
       if (results.affectedRows > 0) {
          res.render("update", { umesg: true, mesg1: false, mesg2: false });
       } else {
          res.render("update", { umesg: false, mesg1: true, mesg2: false });
       }
    });
 });
 




app.get("/deletesearch", (req, res) => {
   const { phone } = req.query;

   let qry = "delete  from student where phone=?";
   mysql.query(qry, [phone], (err, results) => {
       if (err) throw err
       else {
           if (results.affectedRows > 0 ) {
           
               res.render("delete", { mesg3: true, mesg2: false, alert: "Student deleted successfully!" })
               
           } else {

               res.render("delete", { mesg3: false, mesg2: true })

           }

       }
   });
})

// Sample user data
const users = [
    {
        username: "user1", password: "#444#$%43ftt"
    }
];

// Authentication middleware
function authenticate(username, password){
    const user = users.find(u => u.username === username);

    if(user && bcrypt.compareSync(password, user.password)){
        return true;
    }
    return false;
}

// Add this route for rendering the login page
app.get("/login", (req, res) => {
    console.log("Reached /login route");
    res.render("login");
});

// Adding Routes for login functionality
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    console.log("Login Attempt - Username:", username, "Password:", password);

    // Checking if the username and password meet the length requirements
    if(username.length > 14 || password.length > 12){
        return res.render("login", {loginError: true, lengthError: true});
    }

    // Checking if the username exists in the database
    const getUserQuery = "SELECT * FROM users WHERE username = ?";
    mysql.query(getUserQuery, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }

        // Checking if the username and password match a user in the database
        if (results.length > 0 && bcrypt.compareSync(password, results[0].password)) {
            // Valid credentials, set user in the session
            console.log("Login successful. Redirecting to /index");
            req.session.user = username;
            res.redirect("/index");
        } else {
            // Invalid credentials
            console.log("Login failed. Invalid credentials.");
            res.render("login", { loginError: true, errorMessage: "Login failed. Invalid credentials. Please try again." });
        }
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});


// Registration route (GET)
app.get("/register", (req, res) => {
    res.render("register");
    console.log("Reached /register route");
});

// Registration route (POST)
app.post("/register", (req, res) => {
    const { username, password } = req.body;
     console.log("Registration Attempt - Username:", username, "Password:", password);
   
    // Checkingif the username already exists in the database
    const checkUserQuery = "SELECT * FROM users WHERE username = ?";
    mysql.query(checkUserQuery, [username], (checkErr, checkResults) => {
        if (checkErr) {
            console.error(checkErr);
            return res.status(500).send("Internal Server Error");
        }

         // Check if the username is already taken
        if (checkResults.length > 0) {
            // Username already taken
            return res.render("register", { registrationError: true });
        }

        // If Username is available, then hash the password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Inserting the new user into the database
        const insertUserQuery = "INSERT INTO users (username, password) VALUES (?, ?)";
        mysql.query(insertUserQuery, [username, hashedPassword], (insertErr, insertResults) => {
            if (insertErr) {
                console.error(insertErr);
                return res.status(500).send("Internal Server Error");
            }

            // Successfully registered, set user in the session
            req.session.user = username;
            res.redirect("/login");
        });
    });
});





// Creating Server
app.listen(port, (err) => {
    if(err)
    throw err
else
console.log("Server is running at port %d:", port);
});