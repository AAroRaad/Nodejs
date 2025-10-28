const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
      items: [
        {
          productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          quantity: { type: Number, required: true },
        },
      ],
    },
  },
  { timestamps: true }
);

// ===== ADD TO CART =====
userSchema.methods.addToCart = async function (product) {
  const cartProductIndex = this.cart.items.findIndex(
    (cp) => cp.productId.toString() === product._id.toString()
  );

  if (cartProductIndex >= 0) {
    this.cart.items[cartProductIndex].quantity += 1;
  } else {
    this.cart.items.push({
      productId: product._id,
      quantity: 1,
    });
  }

  return this.save();
};

// ===== REMOVE FROM CART =====
userSchema.methods.removeFromCart = async function (productId) {
  this.cart.items = this.cart.items.filter(
    (item) => item.productId.toString() !== productId.toString()
  );
  return this.save();
};

// ===== CLEAR CART =====
userSchema.methods.clearCart = async function () {
  this.cart.items = [];
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
