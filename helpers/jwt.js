const { expressjwt: jwt } = require("express-jwt");

function authJwt() {
  return jwt({
    secret: process.env.secret,
    algorithms: ["HS256"],
    getToken: (req) => {
      console.log("Auth Header:", req.headers.authorization); // Debug token
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
      ) {
        return req.headers.authorization.split(" ")[1];
      }
      return null;
    },
  }).unless({
    path: [
      //  Public routes that don’t need auth
      { url: /.*\.html$/, methods: ['GET'] },

      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/product(.*)/, methods: ["GET", "OPTIONS" , "PUT" , "DELETE"] },
      { url: /\/api\/v1\/category(.*)/, methods: ["GET", "OPTIONS" , "POST" , "PUT"] },
      { url: /\/api\/v1\/brand(.*)/, methods: ["GET", "OPTIONS" , "PUT" , "POST"] },
      { url: /\/api\/v1\/user(.*)/, methods: ["GET", "OPTIONS", "PUT" , "DELETE"] },
      { url: /\/api\/v1\/order(.*)/, methods: ["GET", "OPTIONS" ] },
      { url: /\/api\/v1\/review(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/shipping(.*)/, methods: ["GET", "OPTIONS"] },
      { url: /\/api\/v1\/cart(.*)/, methods: ["GET", "OPTIONS" , "PUT" , "POST"] },
      { url: /\/api\/v1\/payment(.*)/, methods: ["GET", "OPTIONS"] },

      //  Auth routes
      '/favicon.ico',
      "/api/v1/user/login",
      "/api/v1/user/register",
      '/api/v1/image-upload',
      '/placeholder.png',        // exclude specific files
      
      //  Frontend pages (if needed directly)
      "/login.html",
      "/register.html",
      "/index.html",
      "/products.html",
      "/userManage.html",
      "/admin.html",
      "/searchProduct.html",
      "/",
    ],
  });
}

module.exports = authJwt;
