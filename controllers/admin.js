const Product = require("../models/product");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fileHelper = require("../util/file");

// ===== GET ADD PRODUCT =====
exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

// ===== POST ADD PRODUCT =====
exports.postAddProduct = async (req, res, next) => {
  const { title, price, description } = req.body;
  const image = req.file;
  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title,
        price,
        description,
      },
      errorMessage: "Attached file is not an image.",
      validationErrors: [],
    });
  }

  const imageUrl = image.path;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title,
        price,
        description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  const product = new Product({
    // _id: new mongoose.Types.ObjectId("69008665ebc5173835bfa88d"),
    title,
    price,
    description,
    imageUrl,
    userId: req.user,
  });

  try {
    await product.save();
    console.log("Created Product!");
    req.flash("success", "Product added successfully");
    res.redirect("/admin/products");
  } catch (err) {
    // return res.status(500).render("admin/edit-product", {
    //   pageTitle: "Add Product",
    //   path: "/admin/add-product",
    //   editing: false,
    //   hasError: true,
    //   product: {
    //     title,
    //     imageUrl,
    //     price,
    //     description,
    //   },
    //   errorMessage: 'Database opretaion failed, please try again.',
    //   validationErrors: [],
    // });
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// ===== GET EDIT PRODUCT =====
exports.getEditProduct = async (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    req.flash("error", "Something went wrong!");
    return res.redirect("/admin/products");
  }

  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.redirect("/");

    res.render("admin/edit-product", {
      product,
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: editMode,
      product,
      hasError: false,
      errorMessage: null,
      validationErrors: [],
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// ===== POST EDIT PRODUCT =====
exports.postEditProduct = async (req, res, next) => {
  const { productId, title, price, description } = req.body;
  const image = req.file;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title,
        price,
        description,
        _id: productId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/admin/products");
    }
    if (product.userId.toString() !== req.user._id.toString()) {
      req.flash("error", "You have not access to edit this product.");
      return res.redirect("/admin/products");
    }
    product.title = title;
    product.price = price;
    if (image) {
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }
    product.description = description;
    await product.save();
    console.log("UPDATED PRODUCT");
    req.flash("success", "Product updated successfully");
    res.redirect("/admin/products");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// ===== POST DELETE PRODUCT =====
exports.postDeleteProduct = async (req, res, next) => {
  const productId = req.body.productId;

  try {
    const productFile = await Product.findById(productId);
    if (!productFile) {
      return next(new Error("Product not found."));
    }
    fileHelper.deleteFile(productFile.imageUrl);
    await Product.deleteOne({
      _id: productId,
      userId: req.user._id,
    });
    console.log("DESTROYED PRODUCT");
    req.flash("success", "Product deleted successfully");
    res.redirect("/admin/products");
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

// ===== GET ALL PRODUCTS =====
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    // .select("title price -_id")
    // .populate("userId", "name");
    res.render("admin/products", {
      prods: products,
      pageTitle: "Admin Products",
      path: "/admin/products",
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
