const Product = require("../models/product");
const Order = require("../models/order");

// ===== GET ALL PRODUCTS =====
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.render("shop/product-list", {
      prods: products,
      pageTitle: "All Products",
      path: "/products",
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to fetch products.");
  }
};

// ===== GET SINGLE PRODUCT =====
exports.getProduct = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/products");
    }
    res.render("shop/product-detail", {
      product,
      pageTitle: product.title,
      path: "/products",
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to fetch product.");
  }
};

// ===== GET SHOP INDEX =====
exports.getIndex = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.render("shop/index", {
      prods: products,
      pageTitle: "Shop",
      path: "/",
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to fetch products.");
  }
};

// ===== GET CART =====
exports.getCart = async (req, res, next) => {
  try {
    const user = await req.user.populate("cart.items.productId");
    const products = user.cart.items;
    res.render("shop/cart", {
      path: "/cart",
      pageTitle: "Your Cart",
      products: products,
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to load cart.");
    res.redirect("/");
  }
};

// ===== POST ADD TO CART =====
exports.postCart = async (req, res, next) => {
  const productId = req.body.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/products");
    }
    await req.user.addToCart(product);
    res.redirect("/cart");
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to add product to cart.");
    res.redirect("/products");
  }
};

// ===== POST REMOVE FROM CART =====
exports.postCartDeleteProduct = async (req, res, next) => {
  const productId = req.body.productId;
  try {
    await req.user.removeFromCart(productId);
    res.redirect("/cart");
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to remove product from cart.");
    res.redirect("/cart");
  }
};

// ===== POST CREATE ORDER =====
exports.postOrder = async (req, res, next) => {
  try {
    const user = await req.user.populate("cart.items.productId");
    const products = user.cart.items.map((i) => {
      return { quantity: i.quantity, product: { ...i.productId._doc } };
    });
    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user,
      },
      products,
    });
    await order.save();
    await req.user.clearCart();
    res.redirect("/orders");
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to create order.");
    res.redirect("/cart");
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ "user.userId": req.user._id });
    res.render("shop/orders", {
      path: "/orders",
      pageTitle: "Your Orders",
      orders,
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to fetch orders.");
    res.redirect("/");
  }
};
