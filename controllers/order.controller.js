const db = require("../helper/db");

const getTotalOrders = async () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT COUNT(*) AS totalCount FROM \`order\``;
        db.query(query, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result[0].totalCount);
            }
        });
    });
}

const createOrder = async (req, res) => {
    try {
        let orderId;
        let orderTime;

        if (req.body.orderTime) {
            orderTime = req.body.orderTime;
        } else {
            orderTime = new Date();
        }
        const deliveryStatus_id = req.body.s_id || 3;
        const { email, firstName, lastName, country, city, province, number, address, zipCode, shipping_email, shipping_firstName, shipping_lastName, shipping_country, shipping_city, shipping_province, shipping_number, shipping_address, shipping_zipCode, products, paymentMethod, totalAmount } = req.body;
        const quantities = req.body.quantity || [];
        const colorIds = req.body.colorId || [];

        const billingQuery = `INSERT INTO billing_address (email, firstName, lastName, country, city, province, number, address, zipCode, products) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const shippingQuery = `INSERT INTO shipping_address (shipping_email, shipping_firstName, shipping_lastName, shipping_country, shipping_city, shipping_province, shipping_number, shipping_address, shipping_zipCode, products) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertedBilling = await db.query(billingQuery, [email, firstName, lastName, country, city, province, number, address, zipCode, JSON.stringify(products)])

        const insertedShipping = await db.query(shippingQuery, [shipping_email, shipping_firstName, shipping_lastName, shipping_country, shipping_city, shipping_province, shipping_number, shipping_address, shipping_zipCode, JSON.stringify(products)])

        if (insertedBilling && insertedBilling.insertId && insertedShipping && insertedShipping.insertId) {
            const billingId = insertedBilling.insertId;
            const shippingId = insertedShipping.insertId;

            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                const quantity = quantities[i] || 1;
                const colorId = colorIds[i] || 1;

                const searchProductQuery = `
                    SELECT id, productPrice FROM products WHERE id = ?;
                `;

                const productResult = await db.query(searchProductQuery, [product]);
                if (productResult) {
                    const productItems = productResult[0];

                    const orderItem = {
                        billingId,
                        shippingId,
                        productId: productItems.id,
                        quantity: quantity,
                        colorId: colorId,
                        totalAmount: totalAmount,
                        paymentMethod: paymentMethod,
                        userId: req.userId,
                        orderTime: orderTime,
                        s_id: deliveryStatus_id
                    };

                    const insertOrderQuery = `
                        INSERT INTO \`order\` (billing_id, shipping_id, productId, colorId, quantity, totalAmount, paymentMethod, userId, orderTime, s_id)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    orderId = await db.query(insertOrderQuery, [
                        orderItem.billingId,
                        orderItem.shippingId,
                        orderItem.productId,
                        orderItem.colorId,
                        orderItem.quantity,
                        orderItem.totalAmount,
                        orderItem.paymentMethod,
                        orderItem.userId,
                        orderItem.orderTime,
                        orderItem.s_id,
                    ]);

                    // Emitting notification through socket
                    const notificationMessage = `New order created by ${firstName} ${lastName}. The Order id is ${orderId.insertId}`;
                    io.emit('newOrder', notificationMessage);

                    // Save notification in complains table
                    const complainQuery = `INSERT INTO complains (subject, message, notificationDateTime) VALUES (?, ?, CURRENT_TIMESTAMP)`;
                    await db.query(complainQuery, ['New Order Created']);
                } else {
                    console.error(`Product not found for: ${product}`);
                }
            }

            res.status(200).json({ message: 'Order saved successfully' });
        } else {
            throw new Error('Error inserting order. Insert result is not as expected.');
        }
    } catch (error) {
        console.error('Error saving delivery information and order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getAllUserOrderItems = async (req, res) => {
    try {
        let orderQuery = `
            SELECT 
                o.id,
                o.productId,
                o.quantity, 
                o.totalAmount, 
                o.shipping_id,
                p.productName,
                p.productDescription,
                p.productDateTime,
                p.productPrice,
                p.productDiscount,
                p.discountedPrice,
                s.name As deliveryStatus,
                c.name As colorName,
                m.name As methodName,
                shi.shipping_address As shipping_address,
                shi.products As products
            FROM \`order\` o
            JOIN products p ON o.productId = p.id
            JOIN delivery_status s ON o.s_id = s.id
            JOIN colours c ON o.colorId = c.id
            JOIN payment_method m ON o.paymentMethod = m.id
            JOIN shipping_address shi ON o.shipping_id = shi.id`;

        if (req.userId && req.userId !== undefined) {
            orderQuery += ` WHERE userId = ${req.userId}`;
        }

        const orders = await db.query(orderQuery);
        res.status(200).json({
            message: req.userId !== undefined
                ? 'Orders for user with products are fetched successfully'
                : 'Orders with products are fetched successfully',
            orders
        });
    } catch (error) {
        console.error('Error fetching orders with products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getAllOrderItems = async (req, res) => {
    try {
        const page = req.query.page || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        let orderQuery = `
            SELECT
                o.id,
                o.shipping_id,
                o.orderTime,
                o.s_id,
                o.paymentMethod,
                o.totalAmount,
                s.name AS deliveryStatus,
                GROUP_CONCAT(p.productName) AS productNames,
                GROUP_CONCAT(c.name) AS colorNames,
                GROUP_CONCAT(DISTINCT m.name) AS methodNames 
            FROM \`order\` o
            JOIN products p ON o.productId = p.id
            JOIN delivery_status s ON o.s_id = s.id
            JOIN colours c ON o.colorId = c.id
            JOIN payment_method m ON o.paymentMethod = m.id
            GROUP BY o.shipping_id, o.orderTime, o.totalAmount, s.name
            LIMIT ? OFFSET ?
        `;

        const orders = await db.query(orderQuery, [pageSize, offset]);
        const totalCount = await getTotalOrders();
        res.status(200).json({
            message: 'Orders are fetched successfully',
            totalCount,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders with products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getSingleOrder = async (req, res) => {
    try {
        const id = req.params.id;
        let orderQuery = `
            SELECT 
                o.id,
                o.productId, 
                o.quantity, 
                o.totalAmount, 
                p.productName,
                p.productDescription,
                p.productDateTime,
                p.productPrice,
                p.productDiscount,
                p.productMainImage,
                p.discountedPrice,
                s.name As deliveryStatus,
                c.name As colorName,
                m.name As methodName,
                c1.name As categoryName
            FROM \`order\` o
            JOIN products p ON o.productId = p.id
            JOIN delivery_status s ON o.s_id = s.id
            JOIN colours c ON o.colorId = c.id
            INNER JOIN categories c1 ON p.categoryId = c1.id
            JOIN payment_method m ON o.paymentMethod = m.id`;
        orderQuery += ` WHERE o.shipping_id = ${id}`;

        const order = await db.query(orderQuery);

        let userQuery = `
            SELECT 
                o.userId,
                GROUP_CONCAT(DISTINCT u.email) As email,
                GROUP_CONCAT(DISTINCT u.number) As number,
                GROUP_CONCAT(DISTINCT u.firstName) As firstName,
                GROUP_CONCAT(DISTINCT u.lastName) As lastName
                FROM \`order\` o
                JOIN login u ON o.userId = u.id`;

        const user = await db.query(userQuery);

        let shipping_address = `
        SELECT 
        o.shipping_id,
        GROUP_CONCAT(DISTINCT s.shipping_firstName) As firstName,
        GROUP_CONCAT(DISTINCT s.shipping_lastName) As lastName,
        GROUP_CONCAT(DISTINCT s.shipping_address) As address,
        GROUP_CONCAT(DISTINCT s.shipping_province) As province,
        GROUP_CONCAT(DISTINCT s.shipping_zipCode) As zipCode,
        GROUP_CONCAT(DISTINCT s.shipping_country) As country
        FROM \`order\` o
        JOIN shipping_address s ON o.shipping_id = s.id`;
        const shipping = await db.query(shipping_address);

        let billing_address = `
        SELECT 
        o.billing_id,
        GROUP_CONCAT(DISTINCT b.firstName) As firstName,
        GROUP_CONCAT(DISTINCT b.lastName) As lastName,
        GROUP_CONCAT(DISTINCT b.address) As address,
        GROUP_CONCAT(DISTINCT b.province) As province,
        GROUP_CONCAT(DISTINCT b.zipCode) As zipCode,
        GROUP_CONCAT(DISTINCT b.country) As country
        FROM \`order\` o
        JOIN billing_address b ON o.billing_id = b.id`;
        const billing = await db.query(billing_address);
        res.status(200).json({
            message: 'Order is fetched successfully',
            user,
            shipping,
            billing,
            order,
        });
    } catch (error) {
        console.error('Error fetching orders with products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteOrder = async (req, res) => {
    try {
        const id = req.params.id;
        await db.query('DELETE FROM \`order\` WHERE shipping_id = ?', [id]);
        return res.status(200).json({
            message: "Order is deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong"
        })
    }
}

const deleteMultipleOrders = async (req, res) => {
    try {
        const shippingIds = req.body.shippingIds;
        await db.query('DELETE FROM \`order\` WHERE shipping_id IN (?)', [shippingIds]);
        return res.status(200).json({
            message: "Orders are deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            error: "Something went wrong"
        });
    }
}

module.exports = {
    createOrder,
    getAllUserOrderItems,
    getAllOrderItems,
    getSingleOrder,
    deleteOrder,
    deleteMultipleOrders
}