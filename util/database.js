// const {MongoClient} = require('mongodb');

// const uri = "mongodb://localhost:27017";
// const client = new MongoClient(uri);

// async function connectDB() {
//   try {
//     await client.connect();
//     const db = client.db("mydatabase");
//     console.log("✅ Connected to MongoDB");
//     return db;
//   } catch (error) {
//     console.error("❌ MongoDB connection error:", error);
//   }
// }

// connectDB();


// const mongodb = require("mongodb");
// const MongoClient = mongodb.MongoClient;
const {MongoClient} = require('mongodb');
const uri = "mongodb://localhost:27017";

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect(uri)
    .then((client) => {
      console.log("Connected");
      _db = client.db('shop');
      callback();
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw 'No database found!'
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
