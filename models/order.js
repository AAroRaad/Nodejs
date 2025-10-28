const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderProductSchema = new Schema({
  product: {
    type: Schema.Types.Mixed, // می‌تواند هر شیء شامل title, price, imageUrl باشد
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const orderSchema = new Schema(
  {
    products: [orderProductSchema],
    user: {
      email: { type: String, required: true },
      userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
    },
  },
  { timestamps: true } // createdAt و updatedAt اضافه می‌کند
);

module.exports = mongoose.model("Order", orderSchema);
