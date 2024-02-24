const Product = require("../model/product.model");
const admin = require('firebase-admin');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require("../helper/db");


// async function uploadImages(buffer) {
//   try {
//     const uuid = uuidv4();
//     const bucket = admin.storage().bucket();

//     const imageBuffer = fs.readFileSync(buffer.path);
//     const filePath = `Users/${buffer.filename}_${Date.now()}`;
//     const file = bucket.file(filePath);

//     const imageUrl = await new Promise((resolve, reject) => {
//       file.save(imageBuffer, {
//         metadata: {
//           contentType: buffer.mimetype,
//           metadata: {
//             firebaseStorageDownloadTokens: uuid,
//           }
//         },
//         public: false
//       }, async function (err) {
//         if (!err) {
//           const [metadata] = await file.getMetadata();
//           const url = await file.getSignedUrl({
//             action: 'read',
//             expires: '01-01-2025',
//           });
//           resolve(url[0]);
//         } else {
//           console.error('Error uploading image:', err);
//           reject('Failed to upload images');
//         }
//       });
//     });

//     return imageUrl;
//   } catch (error) {
//     console.error('Error uploading images:', error);
//     throw new Error('Failed to upload images');
//   }
// }

const sendDiscountAlert = async (email, productName, discount, id) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "muhammadumair2427@gmail.com",
      pass: "pyap siws tmni bgzm"
    }
  });

  const mailOptions = {
    from: 'muhammadumair2427@gmail.com',
    to: email,
    subject: 'Discount Alert!',
    html: `<p>Hello,</p>
        <p>We are excited to inform you that ${productName} is now available with a ${discount}% discount!</p>
        <p>Hurry up and grab this amazing deal before it's gone.</p>
        <p>Click <a href="http://localhost:8100/product-sale-detail/${id}">here</a> to view the product.</p>`
  };

  await transporter.sendMail(mailOptions);
};

const getBefriendEmails = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT email FROM befriend';
    db.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        const emails = results.map(row => row.email);
        resolve(emails);
      }
    });
  });
};
const getLoginUserEmails = () => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT email FROM login';
    db.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        const emails = results.map(row => row.email);
        resolve(emails);
      }
    });
  });
};

async function uploadImages(imageBuffers) {
  try {
    const uuid = uuidv4();
    const bucket = admin.storage().bucket();
    const uploadedImageUrls = [];

    // Process each image buffer in the array
    for (const buffer of imageBuffers) {
      const imageBuffer = fs.readFileSync(buffer.path);
      const filePath = `Users/${buffer.filename}_${Date.now()}`;
      const file = bucket.file(filePath);

      const imageUrl = await new Promise((resolve, reject) => {
        file.save(imageBuffer, {
          metadata: {
            contentType: buffer.mimetype,
            metadata: {
              firebaseStorageDownloadTokens: uuid,
            }
          },
          public: false
        }, async function (err) {
          if (!err) {
            const [metadata] = await file.getMetadata();
            const url = await file.getSignedUrl({
              action: 'read',
              expires: '01-01-2025',
            });
            resolve(url[0]);
          } else {
            console.error('Error uploading image:', err);
            reject('Failed to upload images');
          }
        });
      });

      uploadedImageUrls.push(imageUrl);
    }

    return uploadedImageUrls;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error('Failed to upload images');
  }
}

const productController = {
  getAllShopProducts: async (req, res) => {
    try {
      const page = req.query.page || 1;
      const pageSize = req.query.pageSize || 10;
      const offset = (page - 1) * pageSize;

      const products = await Product.getAllShopProducts(offset, pageSize);
      const totalCount = products.length;

      res.json({ totalCount, products });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error fetching products" });
    }
  },
  getAllSaleProducts: async (req, res) => {
    try {
      const page = req.query.page || 1;
      const pageSize = req.query.pageSize || 10;
      const offset = (page - 1) * pageSize;

      const products = await Product.getAllSaleProducts(offset, pageSize);
      const totalCount = products.length;

      res.json({ totalCount, products });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error fetching products" });
    }
  },

  getAllProducts: async (req, res) => {
    try {
      const page = req.query.page || 1;
      const pageSize = req.query.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const products = await Product.getAllProducts(offset, pageSize);
      const totalCount = await Product.getTotalProductCount();

      res.json({ totalCount, products });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error fetching products" });
    }
  },

  getProductById: async (req, res) => {
    try {
      const id = req.params.id;
      const singleProductArray = await Product.getProductById(id);

      if (singleProductArray.length === 0) {
        res.status(404).json({
          message: "Product not found",
        });
        return;
      }

      const product = singleProductArray[0];

      res.status(200).json({
        message: "Product fetch successfully",
        product
      });
    } catch (error) {
      res.status(500).json({
        error: "Something went wrong",
        error,
      });
    }
  },


  addProduct: async (req, res) => {
    try {
      const imgArr = req.files;
      // const imageBuffers = imgArr.map(file => file);
      const imageBuffers = [
        imgArr.productMainImage[0],
        imgArr.productGalleryImageOne[0],
        imgArr.productGalleryImageTwo[0],
      ];

      const uploadedImageUrls = await uploadImages(imageBuffers);
      let discountedPrice = 0;
      const productPrice = parseFloat(req.body.productPrice);
      const discount = parseFloat(req.body.productDiscount);
      if (discount >= 0 && discount < 100 && productPrice !== 0) {
        discountedPrice = productPrice - (productPrice * (discount / 100));
      } else {
        throw new Error('Invalid discount or price');
      }

      const productData = {
        productName: req.body.productName,
        productDescription: req.body.productDescription,
        productDateTime: req.body.productDateTime,
        categoryId: req.body.categoryId,
        productPrice: req.body.productPrice,
        productDiscount: req.body.productDiscount,
        statusId: req.body.statusId,
        productMainImage: uploadedImageUrls[0],
        productGalleryImageOne: uploadedImageUrls[1],
        productGalleryImageTwo: uploadedImageUrls[2],
        discountedPrice: discountedPrice,
      };
      const insertedProduct = await Product.addProduct(productData);
      if (discount > 0) {
        const befriendedEmails = await getBefriendEmails();
        for (const email of befriendedEmails) {
          await sendDiscountAlert(email, req.body.productName, discount, insertedProduct.insertId);
        }
        const getLoginUserEmails = await getLoginUserEmails();
        for (const email of getLoginUserEmails) {
          await sendDiscountAlert(email, req.body.productName, discount, insertedProduct.insertId);
        }
      }
      res.status(200).json({ message: 'Product added successfully!' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to add Product' });
    }
  },

  searchProduct: async (req, res) => {
    try {
      const productName = req.body.productName;


      const searchResults = await Product.searchProducts(productName);

      res.status(200).json(searchResults);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Failed to search products' });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const id = req.params.id;
      let imgArr = req.files;

      let discountedPrice = 0;
      const productPrice = parseFloat(req.body.productPrice);
      const discount = parseFloat(req.body.productDiscount);

      if (discount >= 0 && discount < 100 && productPrice !== 0) {
        discountedPrice = productPrice - (productPrice * (discount / 100));
      } else {
        throw new Error('Invalid discount or price');
      }

      // Upload updated images to Firebase Storage
      const updatedImageUrls = await uploadImages([
        imgArr.productMainImage[0],
        imgArr.productGalleryImageOne[0],
        imgArr.productGalleryImageTwo[0],
      ]);

      const updatedProductData = {
        productName: req.body.productName,
        productDescription: req.body.productDescription,
        productDateTime: req.body.productDateTime,
        categoryId: req.body.categoryId,
        productPrice: req.body.productPrice,
        productDiscount: req.body.productDiscount,
        statusId: req.body.statusId,
        productMainImage: updatedImageUrls[0],
        productGalleryImageOne: updatedImageUrls[1],
        productGalleryImageTwo: updatedImageUrls[2],
        discountedPrice: discountedPrice,
      };

      const updatedSaleData = {
        productDiscount: discount,
        product_id: id,
        productName: req.body.productName,
        productDescription: req.body.productDescription,
        productDateTime: req.body.productDateTime,
        category_id: req.body.categoryId,
        productPrice: discountedPrice,
        status_id: req.body.statusId,
        productMainImage: updatedImageUrls[0],
        productGalleryImageOne: updatedImageUrls[1],
        productGalleryImageTwo: updatedImageUrls[2],
      };

      await Product.updateProduct(id, updatedProductData, updatedSaleData);

      res.status(200).json({ message: 'Product updated successfully!' });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  },


  deleteProduct: async (req, res) => {
    try {
      const id = req.params.id;
      await Product.deleteProduct(id);
      return res.status(200).json({
        message: "Product is deleted successfully"
      })
    } catch (error) {
      return res.status(500).json({
        error: "Something went wrong"
      })
    }
  },

  deleteMultipleProducts: async (req, res) => {
    try {
      const productIds = req.body.productIds;
      await Product.deleteMultipleProducts(productIds);
      return res.status(200).json({
        message: "Products are deleted successfully"
      });
    } catch (error) {
      return res.status(500).json({
        error: "Something went wrong"
      });
    }
  },
};

module.exports = productController;