const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const errorHandler = require("./helpers/error.handler");
const authJwt = require("./helpers/jwt");
const methodOverride = require('method-override');

app.use(methodOverride('_method'));


const path = require('path');

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, "front_end/web_proj")));


// Optional: fallback to index.html for unmatched routes (like SPAs)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "front_end/web_proj", "index.html"));
});


app.use(cors());




// middleware

app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);
app.use(authJwt());
app.use((req, res, next) => {
  console.log('➡️ Request:', req.method, req.originalUrl);
  next();
});
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    // You can throttle logging here or only log once per time window
    console.warn('Unauthorized access attempt:', req.path);
    return res.status(401).json({ message: 'Invalid or missing token' });
  }
  next(err);
});



// routes
const productRouter = require("./routes/product");
const orderRouter = require("./routes/order");
const reviewRouter = require("./routes/review");
const shippingRouter = require("./routes/shipping");
const cartRouter = require("./routes/cart");
const userRouter = require("./routes/user");
const brandRouter = require("./routes/brand");
const categoryRouter = require("./routes/category");
const paymentRouter = require("./routes/payment");


const api = process.env.API_URL;

app.use(`${api}/product`, productRouter);
app.use(`${api}/cart`, cartRouter);
app.use(`${api}/order`, orderRouter);
app.use(`${api}/review`, reviewRouter);
app.use(`${api}/shipping`, shippingRouter);
app.use(`${api}/user`, userRouter);
app.use(`${api}/brand`, brandRouter);
app.use(`${api}/category`, categoryRouter);
app.use(`${api}/payment`, paymentRouter);


// database connection
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "shop-user",
  }).then(() => {
    console.log("Database connection is ready");
  }).catch((err) => {
    console.log(err);
  });
app.get('/', (req, res) => {
  res.send(' API is running');
});

  // server
app.listen(3000, () => {
  console.log(api);
  console.log("Server is running on port 3000");
});
