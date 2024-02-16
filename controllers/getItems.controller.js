const db = require('../helper/db');
const validator = require('validator');

const getTableItems = async (req, res, tableName) => {
    try {
        let columns = ['id', 'name'];
        const query = `SELECT ${columns.join(',')} FROM ${tableName}`;
        const items = await db.query(query);

        res.status(200).json({ message: `Get all ${tableName}`, data: items });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Something went wrong',
        });
    }
};

const getDeliveryStatus = async (req, res) => {
    await getTableItems(req, res, 'delivery_status');
};

const getCategories = async (req, res) => {
    await getTableItems(req, res, 'categories');
};

const getPaymentMethod = async (req, res) => {
    await getTableItems(req, res, 'payment_method');
};

const getColors = async (req, res) => {
    await getTableItems(req, res, 'colours');
};

const getStatus = async (req, res) => {
    await getTableItems(req, res, 'status');
};

const beFriend = async (req, res) => {
    try {
        const { email } = req.body;

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        await db.query('INSERT INTO befriend (email) VALUES (?)', [email]);
        return res.status(200).json({ message: 'Congratulations! Now we are friends' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getDeliveryStatus,
    getCategories,
    getPaymentMethod,
    getColors,
    getStatus,
    beFriend
};
