const express = require("express");
const { check, body } = require("express-validator");
const bcrypt = require("bcryptjs");

const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("please enter a valid email.")
      // .normalizeEmail()
      .custom(async (email, { req }) => {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error("Invalid email or password.");
        }
        req.user = user;
        return true;
      }),
    body(
      "password",
      "Please enter a password with only numbers and text and at least 5 characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
      .custom(async (password, { req }) => {
        const doMatch = await bcrypt.compare(password, req.user.password);
        if (!doMatch) {
          throw new Error("Invalid email or password.");
        }
        return true;
      }),
  ],
  authController.postLogin
);

router.get("/signup", authController.getSignup);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("please enter a valid email.")
      .normalizeEmail()
      .custom(async (value, { req }) => {
        // if (value === "test@test.com") {
        //   throw new Error("This email address is forbidden");
        // }
        // return true;
        const existingUser = await User.findOne({ email: value });
        if (existingUser) {
          throw new Error(
            "E-Mail exists already, please pick a different one."
          );
        }
      }),
    body(
      "password",
      "Please enter a password with only numbers and text and at least 5 characters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
    body("confirmPassword")
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("passwords do not match!");
        }
        return true;
      }),
  ],
  authController.postSignup
);

router.post("/logout", isAuth, authController.postLogout);

router.get("/reset-password", authController.getReset);

router.post("/reset-password", authController.postReset);

router.get("/reset-password/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
