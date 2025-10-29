const Product = require("../models/product");
const { validationResult } = require("express-validator");

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
  const { title, imageUrl, price, description } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title,
        imageUrl,
        price,
        description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  // if (!title || !price || !imageUrl || !description) {
  //   req.flash("error", "All fields are required.");
  //   return res.redirect("/admin/add-product");
  // }

  const product = new Product({
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
    console.log(err);
    req.flash("error", "Failed to create product.");
    res.redirect("/admin/add-product");
  }
};

// ===== GET EDIT PRODUCT =====
exports.getEditProduct = async (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
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
      hasError: false,
      errorMessage: null,
      validationErrors: [],
    });
  } catch (err) {
    console.log(err);
    res.redirect("/admin/products");
  }
};

// ===== POST EDIT PRODUCT =====
exports.postEditProduct = async (req, res, next) => {
  const { productId, title, imageUrl, price, description } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title,
        imageUrl,
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
    product.imageUrl = imageUrl;
    product.description = description;
    await product.save();
    console.log("UPDATED PRODUCT");
    req.flash("success", "Product updated successfully");
    res.redirect("/admin/products");
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to update product.");
    res.redirect("/admin/products");
  }
};

// ===== POST DELETE PRODUCT =====
exports.postDeleteProduct = async (req, res, next) => {
  const productId = req.body.productId;

  try {
    const product = await Product.deleteOne({
      _id: productId,
      userId: req.user._id,
    });
    if (product.userId.toString() !== req.user._id.toString()) {
      req.flash("error", "You have not access to delete this product.");
      return res.redirect("/admin/products");
    }
    console.log("DESTROYED PRODUCT");
    req.flash("success", "Product deleted successfully");
    res.redirect("/admin/products");
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to delete product.");
    res.redirect("/admin/products");
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
    console.log(err);
    req.flash("error", "Failed to fetch products.");
    res.redirect("/");
  }
};
