const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());
app.use(cors());

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/paymentDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// MongoDB Schema
const OrderSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobileNumber: String,
  amount: Number,
  orderId: String,
  status: { type: String, default: "PENDING" },
});

const Order = mongoose.model('Order', OrderSchema);

// Constants
const MERCHANT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const MERCHANT_ID = "PGTESTPAYUAT86";
const MERCHANT_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
const MERCHANT_STATUS_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status";
const redirectUrl = "http://localhost:8000/status";
const successUrl = "http://localhost:5173/payment-success";
const failureUrl = "http://localhost:5173/payment-failure";

// Route to create an order
app.post('/create-order', async (req, res) => {
  const { name, email, mobileNumber, amount } = req.body;
  const orderId = uuidv4();

  // Save order to MongoDB
  const order = new Order({
    name,
    email,
    mobileNumber,
    amount,
    orderId,
  });

  await order.save();

  // Payment payload
  const paymentPayload = {
    merchantId: MERCHANT_ID,
    merchantUserId: name,
    mobileNumber,
    amount: amount * 100,
    merchantTransactionId: orderId,
    redirectUrl: `${redirectUrl}/?id=${orderId}`,
    redirectMode: 'POST',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
  const keyIndex = 1;
  const string = payload + '/pg/v1/pay' + MERCHANT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const checksum = sha256 + '###' + keyIndex;

  const option = {
    method: 'POST',
    url: MERCHANT_BASE_URL,
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
    },
    data: {
      request: payload,
    },
  };

  try {
    const response = await axios.request(option);
    console.log(response.data.data.instrumentResponse.redirectInfo.url);
    res.status(200).json({ msg: "OK", url: response.data.data.instrumentResponse.redirectInfo.url });
  } catch (error) {
    console.log("error in payment", error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Route to check payment status
app.post('/status', async (req, res) => {
  const merchantTransactionId = req.query.id;

  const keyIndex = 1;
  const string = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + MERCHANT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const checksum = sha256 + '###' + keyIndex;

  const option = {
    method: 'GET',
    url: `${MERCHANT_STATUS_URL}/${MERCHANT_ID}/${merchantTransactionId}`,
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'X-MERCHANT-ID': MERCHANT_ID,
    },
  };

  try {
    const response = await axios.request(option);
    const status = response.data.success ? "SUCCESS" : "FAILURE";

    // Update order status in MongoDB
    await Order.findOneAndUpdate(
      { orderId: merchantTransactionId },
      { status }
    );

    if (response.data.success) {
      return res.redirect(successUrl);
    } else {
      return res.redirect(failureUrl);
    }
  } catch (error) {
    console.log("Error checking status:", error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

// Start the server
app.listen(8000, () => {
  console.log('Server is running on port 8000');
});
