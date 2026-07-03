require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Otp = require('../models/otp');


// Setup Nodemailer transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTP = async (req,res) =>{
    try{
    
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); 
    

    await Otp.deleteMany({ email });
    // Save OTP to the database
    await Otp.create({ email, otp, expiry });

    // Send the OTP via email

      console.log("Sending OTP to", email, "via", process.env.EMAIL_USER);
    
        await transporter.sendMail({
    from: `friendsbook <${process.env.EMAIL_USER}>`, 
    to: email,
    subject: 'Your OTP for Registration',
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
});


    
        res.status(200).json({ message: 'OTP sent to email' });

    }
    catch(err){
        console.log(err.message);
         console.error("SendMail error:", err && err.code, err && err.message);
        res.status(500).json({ error: 'Failed to send OTP. Try again later.' });

    }
}

const validateOTP = async (req,res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try{

        
             const otpRecord = await Otp.findOne({ email, otp });
        
                if (!otpRecord) {
                    return res.status(400).json({ error: 'Invalid OTP' });
                }
        
                // Check if OTP has expired
                if (new Date() > otpRecord.expiry) {
                    await Otp.deleteOne({ _id: otpRecord._id }); // Clean up expired OTP
                    return res.status(400).json({ error: 'OTP has expired' });
                }
        
                // OTP is valid
                await Otp.deleteOne({ _id: otpRecord._id }); // Remove OTP after successful validation
                res.status(200).json({ message: 'OTP validated successfully' });

    }
    catch(err){
        console.log(err.message);
         res.status(500).json({ error: 'Failed to validate OTP. Try again later.' });

    }
}

const registerUser = async (req,res) => {
    
    const { username, fullname, email, password } = req.body;
    try {
            // Check if a user with the same email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }
    
            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(password, 10);
    
            // Create a new user instance with the additional fields
            const newUser = new User({
                username,
                fullname,
                email,
                password: hashedPassword, // Save hashed password
            });
    
            // Save the new user to the database
            await newUser.save();
    
            // Create a JWT payload including the new fields
            const payload = {
                userId: newUser._id,
                username: newUser.username,
                email: newUser.email,
                
            };
    
            // Generate a JWT token that expires in 30 days
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
    
            // Respond with the generated token and user details
            return res.status(201).json({
                token, 
                payload,
                message: 'Registration successful!',
            });
    
        } catch (err) {
            console.error('Error registering user:', err.message);
            return res.status(500).json({ error: 'Error registering user' });
        }


}

const verifyKey = async (req,res) => {
     const { email, friendsbookKey } = req.body;
     
        try {
            // Find the user by email
            const user = await User.findOne({ email });

            console.log(user);

            if (!user) {
                return res.status(401).json({ error: 'Email not registered' });
            }
    
    
          
    
               // Verify the friendsbookKey
               if (!user.friendsbookKey || !user.friendsbookKey.key) {
                   console.log("No active key found for this user");
                   return res.status(401).json({ error: 'No active Friendsbook key found for this account.' });
               }
               const isMatch = await bcrypt.compare(friendsbookKey, user.friendsbookKey.key);

               console.log(friendsbookKey);
               console.log(user.friendsbookKey?.key);

               if (!isMatch) {
                   console.log("Invalid key");
                   return res.status(401).json({ error: 'Invalid Friendsbook Key' });
               }
    
          
    


            // Generate a new token after verifying the key
            const payload = {
                userId: user._id,
                username: user.username,
                email: user.email,
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
    
            res.json({ token, payload }); 
    
        } catch (err) {
            console.error('Error during key verification:', err.message);
            res.status(500).json({ message: 'Server error.' });
        }
}

const loginUser = async (req, res) => {
  const { email, password, isGoogleLogin } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email not registered' });
    }

    // If Google login → skip password check
    if (!isGoogleLogin) {
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    if (user.friendsbookKey?.active) {
      return res.status(200).json({ active: true });
    }

    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    return res.json({ token, payload });
  } catch (error) {
    console.error('Error during login:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }
};



const checkEmail = async (req,res) =>{
  
    const { email } = req.body;
  try {

      const user = await User.findOne({ email });
   
      if (user) {
          return res.json({ exists: true });
      }

      res.json({ exists: false });
  } catch (err) {
      console.error('Error checking email:', err.message);
      res.status(500).json({ error: 'Internal server error' });
  }

}

const googleAuth = async (req, res) => {
  const { email, name, picture } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // 1. Generate unique username from name or email prefix
      let baseUsername = name
        ? name.toLowerCase().replace(/[^a-z0-9]/g, '')
        : email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!baseUsername) {
        baseUsername = 'user';
      }

      let username = baseUsername;
      let usernameExists = await User.findOne({ username });
      while (usernameExists) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        username = `${baseUsername}${randomNum}`;
        usernameExists = await User.findOne({ username });
      }

      // 2. Generate secure random password
      const randomPass = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPass, 10);

      // 3. Create and save new User
      user = new User({
        username,
        fullname: name || email.split('@')[0],
        email,
        password: hashedPassword,
        profilePic: picture || '/images/squarepfp.png',
      });
      await user.save();
    } else {
      // If user exists, check Friendsbook key validation
      if (user.friendsbookKey?.active) {
        return res.status(200).json({ active: true });
      }
    }

    // Generate JWT token
    const payload = {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    return res.json({ token, payload });
  } catch (error) {
    console.error('Error during googleAuth:', error.message);
    return res.status(500).json({ error: 'Server error during Google Authentication' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Email not registered' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiry });

    // Send OTP via email using transporter
    console.log("Sending Password Reset OTP to", email);
    await transporter.sendMail({
      from: `friendsbook <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - friendsbook',
      text: `You requested a password reset. Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.status(200).json({ message: 'Reset OTP sent successfully' });
  } catch (error) {
    console.error('Error during forgotPassword:', error.message);
    res.status(500).json({ error: 'Failed to send reset OTP. Try again later.' });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Email, OTP, and new password are required' });
  }

  try {
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (new Date() > otpRecord.expiry) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // OTP is valid. Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    // Clean up OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: 'Password reset successful!' });
  } catch (error) {
    console.error('Error during resetPassword:', error.message);
    res.status(500).json({ error: 'Failed to reset password. Try again later.' });
  }
};

module.exports = {sendOTP, validateOTP, registerUser, verifyKey, loginUser, checkEmail, googleAuth, forgotPassword, resetPassword}