const admin = require("firebase-admin");

var serviceAccount = require('../firebase_admin/serviceAccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://fizanoorcollection.appspot.com",
  });
  
  module.exports = admin;