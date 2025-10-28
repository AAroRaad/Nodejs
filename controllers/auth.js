const { promisify } = require("util");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Resend } = require("resend");

const randomBytesAsync = promisify(crypto.randomBytes);

const User = require("../models/user");
const { buffer } = require("stream/consumers");

const resend = new Resend(process.env.RESEND_API_KEY);

// ===== GET LOGIN =====
exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
  });
};

// ===== POST LOGIN =====
exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    const doMatch = await bcrypt.compare(password, user.password);
    if (!doMatch) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    req.session.isLoggedIn = true;
    req.session.user = user;
    await req.session.save();
    res.redirect("/");
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong, please try again.");
    res.redirect("/login");
  }
};

// ===== GET SIGNUP =====
exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
  });
};

// ===== POST SIGNUP =====
exports.postSignup = async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    req.flash("error", "Passwords do not match.");
    return res.redirect("/signup");
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash("error", "E-Mail exists already, please pick a different one.");
      return res.redirect("/signup");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      cart: { items: [] },
    });
    await user.save();
    console.log("User Created");

    // ارسال ایمیل بعد از ثبت نام
    resend.emails
      .send({
        from: "AAro <onboarding@resend.dev>",
        to: email,
        subject: "Signup Succeeded",
        html: "<h1>You successfully signed up!</h1>",
      })
      .catch((err) => console.log("Email send error:", err));

    req.flash("success", "Signup successful! Please login.");
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong, please try again.");
    res.redirect("/signup");
  }
};

// ===== POST LOGOUT =====
exports.postLogout = async (req, res, next) => {
  try {
    await req.session.destroy();
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset-password",
    pageTitle: "Reset Password",
  });
};

// exports.postReset = (req, res, next) => {
//   crypto.randomBytes(32, (err, buffer) => {
//     if (err) {
//       console.log(err);
//       req.flash("error", "Something went wrong, please try again.");
//       return res.redirect("/reset-password");
//     }
//     const token = buffer.toString("hex");
//     User.findOne({ email: req.body.email })
//       .then((user) => {
//         if (!user) {
//           req.flash("error", "No account with that email found.");
//           return res.redirect("/reset-password");
//         }
//         user.resetToken = token;
//         user.resetTokenExpiration = Date.now() + 3600000;
//         return user.save();
//       })
//       .then((result) => {
//         res.redirect('/')ک
//         resend.emails.send({
//           from: "AAro <onboarding@resend.dev>",
//           to: req.body.email,
//           subject: "Password Reset",
//           html: `
//             <p>You requested a password reset</p>
//             <p>Click this <a href="http://localhost/reset-password/${token}">link</a> to set a new password.</p>
//           `,
//         });
//       })
//       .catch((err) => console.log(err));
//   });
// };

exports.postReset = async (req, res, next) => {
  try {
    const buffer = await randomBytesAsync(32);

    const token = buffer.toString("hex");

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.flash("error", "No account with that email found.");
      return res.redirect("/reset-password");
    }

    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 ساعت
    await user.save();

    await resend.emails.send({
      from: "AAro <onboarding@resend.dev>",
      to: req.body.email,
      subject: "Password Reset",
      html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="http://localhost:3000/reset-password/${token}">link</a> to set a new password.</p>
            <p>This link will expire in 1 hour.</p>
          `,
    });
    req.flash("success", "Reset password link sent to your email.");
    res.redirect("/");
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong, please try again later.");
    res.redirect("/reset-password");
  }
};

exports.getNewPassword = async (req, res, next) => {
  const token = req.params.token;
  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }, // بررسی انقضای توکن
    });
    if (!user) {
      req.flash("error", "Password reset token is invalid or has expired.");
      return res.redirect("/reset-password");
    }
    res.render("auth/new-password", {
      path: "/new-password",
      pageTitle: "New Password",
      userId: user._id.toString(),
      passwordToken: token,
    });
  } catch (err) {
    console.log(err);
    res.redirect("/reset-password");
  }
};

// exports.postNewPassword = (req, res, next) => {
//   const newPassword = req.body.password;
//   const userId = req.body.userId;
//   const passwordToken = req.body.passwordToken;
//   let resetUser;

//   User.findOne({
//     resetToken: passwordToken,
//     resetTokenExpiration: { $gt: Date.now() },
//     _id: userId,
//   })
//     .then((user) => {
//       resetUser = user;
//       return bcrypt.hash(newPassword, 12);
//     })
//     .then((hashedPassword) => {
//       resetUser.password = hashedPassword;
//       resetUser.resetToken = undefined;
//       resetUser.resetTokenExpiration = undefined;
//       return resetUser.save();
//     })
//     .then((result) => {
//       return resend.emails.send({
//         from: "AAro <onboarding@resend.dev>",
//         to: req.body.email,
//         subject: "Password Reseted",
//         html: "<p>Your password have been reseted</p>",
//       });
//     })
//     .then((result) => {
//       req.flash("success", "Password reseted successfully.");
//       res.redirect("/login");
//     })
//     .catch((err) => console.log(err));
// };

exports.postNewPassword = async (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  try {
    const user = await User.findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId,
    });
    if (!user) {
      req.flash("error", "Reset token is invalid or has expired.");
      return res.redirect("/reset-password");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    await resend.emails.send({
      from: "AAro <onboarding@resend.dev>",
      to: user.email,
      subject: "Password Reset Successful",
      html: "<p>Your password has been successfully reset!</p>",
    });
    req.flash("success", "Your password has been reset successfully.");
    res.redirect("/login");
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong, please try again.");
    res.redirect("/reset-password");
  }
};