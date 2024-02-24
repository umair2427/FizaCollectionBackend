const jwt = require("jsonwebtoken");

const checkIfAuthenticated = (req, res, next) => {
  try {
    const idToken = req.headers.authorization;
    if (idToken) {
      const decoded = jwt.verify(idToken, "fizaCollection");
      console.log(decoded);
      req.userId = decoded.userId;
      next();
    } else {
      res.userId = null
      next();
    }

  } catch (error) {
    return res.status(401).send('Invalid token');
  }
};

module.exports = { checkIfAuthenticated };
