const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  User.findById("68fdc6d1a9857b6f52d63420")
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

// app.use((req, res, next) => {
//   res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
//   res.set('Pragma', 'no-cache');
//   res.set('Expires', '0');
//   next(); // allows the request to continue to the next middleware in line
// });

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
  .connect("mongodb://localhost:27017/shop")
  .then(() => {
    User.findOne().then((user) => {
      if (!user) {
        const user = new User({
          name: "AAro",
          email: "aaro@gmail.com",
          cart: {
            items: [],
          },
        });
        user.save();
      }
    });
    app.listen(3000);
  })
  .catch((err) => console.log(err));
