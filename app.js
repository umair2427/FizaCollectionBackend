const express = require('express');
const db = require('./helper/db');
var cors = require('cors');
const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.route');
const complainRoutes = require('./routes/complain.routes');
const orderRoutes = require('./routes/order.route');
const itemsRoutes = require('./routes/getItems.routes');

const app = express();
const port = 3000; 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors());

app.use('/api', productRoutes, authRoutes, complainRoutes, orderRoutes, itemsRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });