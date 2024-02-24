const bcrypt = require('bcrypt');
const db = require("../helper/db");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

const comparePasswords = async (password, hashedPassword) => {
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, alterEmail, dob, email, password, confirmPassword, number } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const checkEmailQuery = 'SELECT * FROM login WHERE email = ?';
    const existingUser = await db.query(checkEmailQuery, [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const query = 'INSERT INTO login (firstName, lastName, alterEmail, dob, email, password, number) VALUES (?, ?, ?, ?, ?, ?, ?)';

    await db.query(query, [firstName, lastName, alterEmail, dob, email, hashedPassword, number])
    return res.status(200).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const getUserQuery = 'SELECT * FROM login WHERE email = ?';
    const userData = await db.query(getUserQuery, [email]);

    if (userData.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const storedHashedPassword = userData[0].password;
    const passwordMatch = await comparePasswords(password, storedHashedPassword);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const payload = {
      userId: userData[0].id,
      email: userData[0].email,
      firstName: userData[0].firstName,
      lastName: userData[0].lastName
    };

    const secretKey = 'fizaCollection';

    const token = jwt.sign(payload, secretKey, { expiresIn: '3h' });

    return res.status(200).json({ message: 'Login successful', token});
  } catch (error) {
    res.status(401).json({ error: 'Internal server error', message: error.message });
  }
};

const generateToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

const sendResetEmail = async (email, token) => {
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
    subject: 'Password Reset',
    html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
          <p>Please click on the following link to reset your password:</p>
          <p><a href="http://localhost:8101/reset-password/${token}">Reset Password</a></p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`
  };

  await transporter.sendMail(mailOptions);
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await db.query('SELECT * FROM login WHERE email = ?', [email]);

    if (!user || user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = generateToken();
    await db.query('INSERT INTO password_reset_tokens (email, token) VALUES (?, ?)', [email, token]);

    await sendResetEmail(email, token);

    return res.status(200).json({ message: 'Reset email sent successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const result = await db.query('SELECT * FROM password_reset_tokens WHERE token = ?', [token]);

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.query('UPDATE login SET password = ? WHERE email = ?', [hashedPassword, result[0].email]);

    await db.query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);

    return res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
