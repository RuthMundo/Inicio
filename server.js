var express = require("express");
var app = express();
var formidable = require("express-formidable");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var http = require("http").createServer(app);
var jwt = require("jsonwebtoken");

var accessTokenSecret = "myAccessTokenSecret1234567890";
app.use(formidable());
app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

var socketIO = require("socket.io")(http);
var socketID = "";
var users = [];

// MongoDB connection using Mongoose
mongoose.connect("mongodb://localhost:27017/my_social_network", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Conectado a la base de datos.");
}).catch(err => {
    console.error("Error de conexión a la base de datos:", err);
});

// User schema
var userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
    gender: String,
    profileImage: String,
    coverPhoto: String,
    dob: String,
    city: String,
    country: String,
    aboutMe: String,
    friends: Array,
    pages: Array,
    notifications: Array,
    groups: Array,
    posts: Array,
});

var User = mongoose.model("User", userSchema);

socketIO.on("connection", function (socket) {
    console.log("Usuario conectado", socket.id);
    socketID = socket.id;
});

http.listen(3000, function () {
    console.log("Server started.");

    app.get("/signup", function (request, result) {
        result.render("signup");
    });

    app.post("/signup", function (request, result) {
        var { name, username, email, password, gender } = request.fields;

        User.findOne({ $or: [{ email }, { username }] }, function (error, user) {
            if (user == null) {
                bcrypt.hash(password, 10, function (error, hash) {
                    var newUser = new User({
                        name,
                        username,
                        email,
                        password: hash,
                        gender,
                        profileImage: "",
                        coverPhoto: "",
                        dob: "",
                        city: "",
                        country: "",
                        aboutMe: "",
                        friends: [],
                        pages: [],
                        notifications: [],
                        groups: [],
                        posts: [],
                    });

                    newUser.save(function (error) {
                        if (error) {
                            return result.json({
                                status: "error",
                                message: "Error saving user."
                            });
                        }
                        result.json({
                            status: "success",
                            message: "Signed up successfully. You can login now."
                        });
                    });
                });
            } else {
                result.json({
                    status: "error",
                    message: "Email or username already exists."
                });
            }
        });
   });
    app.get("/login", function (request, result){
        result.render("login");
    });
    app.get("/updateProfile", function (request, result){
        result.render("updateProfile");
    });
    app.post("/login", function (request, result){
        var email = request.fields.email;
        var password = request.fields.password;
        database.collection("users").finOne({
            "email": email
        }, function (error, user){
            if(user == null){
                result.json({
                    "status": "error",
                    "message": "Email does not exist"
                });
            } else {
                bcrypt.compare(password, user.password, function(error, isVerify){
                    if (isVerify){
                        var accessToken = jwt.sign({email: email}, accessTokenSecret);
                        database.collection("users").finOneAndUpdate({
                            "email": email
                        }, {
                            $set: {
                                "accessToken": accessToken
                            }
                        }, function (error, data){
                            result.json({
                                "status": "success",
                                "message": "Login successfully",
                                "accessToken": accessToken,
                                "profileImage": user.profileImage
                            });
                        });
                    } else{
                        result.json({
                            "status": "error",
                            "message": "Password is not correct"
                        });
                    }
                });
            }
        });
    });
        
});

