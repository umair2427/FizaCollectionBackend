const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const upload = require("../middleware/multer.middleware");
const firebaseMiddleware = require("../middleware/firebaseAuth.middleware");

router.post(
  "/addProduct",
  firebaseMiddleware.verifyTokenMiddleware,
  upload.fields([
    { name: 'productMainImage', maxCount: 1 },
    { name: 'productGalleryImageOne', maxCount: 1 },
    { name: 'productGalleryImageTwo', maxCount: 1 }
  ]),
  productController.addProduct
);
router.get(
  "/allShopProducts",
  productController.getAllShopProducts
);
router.get(
  "/allSaleProducts",
  productController.getAllSaleProducts
);
router.get(
  "/allProducts",
  firebaseMiddleware.verifyTokenMiddleware,
  productController.getAllProducts
);
router.get(
  "/getSingleProduct/:id",
  productController.getProductById
);
router.patch(
  "/updateProduct/:id",
  firebaseMiddleware.verifyTokenMiddleware,
  upload.fields([
    { name: 'productMainImage', maxCount: 1 },
    { name: 'productGalleryImageOne', maxCount: 1 },
    { name: 'productGalleryImageTwo', maxCount: 1 }
  ]),
  productController.updateProduct
);
router.delete(
  "/deleteProduct/:id",
  firebaseMiddleware.verifyTokenMiddleware,
  productController.deleteProduct
);

router.post(
  '/products/delete-multiple',
  firebaseMiddleware.verifyTokenMiddleware,
  productController.deleteMultipleProducts);

router.post(
  '/search',
  productController.searchProduct
)

module.exports = router;
