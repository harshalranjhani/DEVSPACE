// Modules
require('dotenv').config();
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const passport = require("passport");
const localStratergy = require("passport-local");
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const mongoSanitize = require('express-mongo-sanitize');
const session = require("express-session");
const users = require("./controllers/user");
const MongoStore = require('connect-mongo');
const User = require("./models/users");
const { isLoggedIn } = require("./middleware");
const dbUrl = process.env.MONGO_URL || "mongodb://localhost:27017/devspace";

// Database Connections
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch((err) => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

const secret = process.env.SECRET || "developmentSecret";

const store = MongoStore.create({
  mongoUrl: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60,
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

// Middleware
const sessionConfig = {
  store,
  name: "session",
  httpOnly: true,
  secret: "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(session(sessionConfig));
app.use(flash());
app.use(mongoSanitize());

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStratergy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Locals
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Landing Page route
app.get("/", (req, res) => {
  res.render("index");
});

// Predictions Route
app.get("/predictions", isLoggedIn, (req, res) => {
  res.render("predictions");
});

// Auth routes
app.get("/register", users.renderRegisterForm);
app.post("/register", users.registerUser);

app.get("/login", users.renderLoginForm);
app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  users.login
);

app.get("/logout", users.logout);

app.all("*", (req, res) => {
  res.status(404).render("error");
});

//Error handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went Wrong!";
  res.status(statusCode).render("error", { err, statusCode });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
