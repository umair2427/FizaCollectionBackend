const db = require("../helper/db");

const Product = {
    getAllShopProducts: (offset, pageSize, callback) => {
        const query = `
        SELECT 
            products.*,
            categories.name AS categoryName
            FROM
                products
            LEFT JOIN
            categories ON products.categoryId = categories.id
            WHERE
            products.productDiscount = 0
            ORDER BY
            products.productDateTime DESC
            LIMIT ? OFFSET ?;
    `;

        return db.query(query, [parseInt(pageSize, 10), parseInt(offset, 10)], callback);
    },
    getAllSaleProducts: (offset, pageSize, callback) => {
        const query = `
        SELECT 
            products.*,
            categories.name AS categoryName
            FROM
                products
            LEFT JOIN
            categories ON products.categoryId = categories.id
            WHERE
            products.productDiscount != 0
            ORDER BY
            products.productDateTime DESC
            LIMIT ? OFFSET ?;
    `;

        return db.query(query, [parseInt(pageSize, 10), parseInt(offset, 10)], callback);
    },



    getProductById: async (id) => {
        try {
            let data = await db.query(
                `SELECT 
            products.*, 
            categories.name AS categoryName,
            status.name AS statusName
        FROM 
            products
        LEFT JOIN 
            categories ON products.categoryId = categories.id
        LEFT JOIN 
            status ON products.statusId = status.id
        WHERE 
            products.id = ?`, [id]);
            return data;
        } catch (error) {
            return error;
        }
    },

    addProduct: async (productData) => {
        try {
            let data = await db.query('INSERT INTO products SET ?', productData);
            return data;
        } catch (error) {
            console.error("Error inserting data:", error);
            return error;
        }
    },

    updateProduct: async (productId, updatedProductData, updatedSaleData) => {
        try {
            await db.query('UPDATE products SET ? WHERE id = ?', [updatedProductData, productId]);

            if (updatedSaleData.productDiscount !== 0) {
                await db.query('UPDATE sales SET ? WHERE product_id = ?', [updatedSaleData, productId]);
            }
            return { message: 'Product and Sale updated successfully!' };
        } catch (error) {
            console.error("Error updating product and sale:", error);
            throw new Error('Failed to update product and sale');
        }
    },

    deleteProduct: async (id, callback) => {
        try {
            const data = await db.query('DELETE FROM products WHERE id = ?', [id]);
            return data;
        } catch (error) {
            return error;
        }
    },

    deleteMultipleProducts: async (productIds) => {
        try {
            const data = await db.query('DELETE FROM products WHERE id IN (?)', [productIds]);
            return data;
        } catch (error) {
            return error;
        }
    },
};

module.exports = Product
