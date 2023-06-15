const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require('jimp');
const {nanoid} = require('nanoid')

const {User} = require("../models/user");
const {HttpError, ctrlWrapper, sendEmail} = require("../helpers");
const {SECRET_KEY, PROJECT_URL} = require("../config");
const { throws } = require("assert");
const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async(req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});

    if(user){
        throw new HttpError(409,"Email already in use")
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const verificationToken = nanoid();

    const avatarURL = gravatar.url(email);

    const newUser = await User.create({...req.body, password: hashPassword, avatarURL, verificationToken})

    const verifyEmail = {
        to: email,
        sabject: "Verify email",
        html: `<a target="_blank" href="${PROJECT_URL}/api/auth/verify/${verificationToken}">Click to verify email</a>`
    }
    await sendEmail(verifyEmail)

    const {_id: id} = newUser;

    const payload = {
        id,
    }

    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: "23h"});

    res.status(201).json({
        token,
        user: {
            name: newUser.name,
            email: newUser.email,
        }
    })
};

const verify = async(req, res) => {
    const {verificationToken} = req.params;
    const user = await User.findOne({verificationToken})
    if(!user) {
        throw new HttpError(404);
    }
    await User.findByIdAndUpdate(user._id, {verify: true, verificationToken: ""});

    res.json({
        message: "Verification successful"
    })
}

const resendVerifyEmail = async(req, res) => {
    const {email} = req.body;
    const user = await User.findOne({email});
    if(!user) {
        throw new HttpError (400, "missing required field email");
    }
    if(user.verify) {
        throw new HttpError (400, "Verification has already been passed");
    }
    const verifyEmail = {
        to: email,
        sabject: "Verify email",
        html: `<a target="_blank" href="${PROJECT_URL}/api/auth/verify/${verificationToken}">Click to verify email</a>`
    }
    await sendEmail(verifyEmail)

    res.json({
        message: "Verification email sent"
    })
}

const login = async(req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email})
    if(!user || !user.verify) {
        throw new HttpError(401, "Email or password invalid")
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if(!passwordCompare) {
        throw new HttpError(401, "Email or password invalid")
    }

    const payload = {
        id: user._id
    };

    const token = jwt.sign(payload, SECRET_KEY, {expiresIn: "23h"})
    await User.findByIdAndUpdate(user._id, {token})
    res.json({ 
        token,
    })
}

const getCurrent = async(req, res) => {
    const {email,name} = req.user;
    res.json({
        email,
        name,
    })
}

const logout = async(req, res) => {
    const {_id} = req.user;
    await User.findByIdAndUpdate(_id, {token: ""})

    res.json({
        message: "Logout success"
    })
}

const updateSubscription = async(req, res) => {
    const {_id} = req.user;
      const newSubscription = req.body.subscription;
        try {
        const result = await User.findByIdAndUpdate(_id, { subscription: newSubscription }, { new: true });
    
        if (!result) {
          throw new HttpError(404, "Not found");
        }
    
        return res.json(result);
      } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
      }
}

const updateAvatar = async(req, res)=> {
    const {_id} = req.user;
    const {path: tempUpload, originalname} = req.file;
    const filename = `${_id}_${originalname}`;
    const resultUpload = path.join(avatarsDir, filename);

    await Jimp.read(tempUpload)
    .then(image => {
      return image
        .resize(250, 250)
        .write(resultUpload);
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Помилка при обробці аватарки' });
    });

    await fs.rename(tempUpload, resultUpload);
    const avatarURL = path.join("avatars", filename);
    await User.findByIdAndUpdate(_id, {avatarURL});

    res.json({
        avatarURL,
    })
}

module.exports = {
    register: ctrlWrapper(register),
    verify: ctrlWrapper(verify),
    resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
    login: ctrlWrapper(login),
    getCurrent: ctrlWrapper(getCurrent),
    logout: ctrlWrapper(logout),
    updateSubscription: ctrlWrapper(updateSubscription),
    updateAvatar: ctrlWrapper(updateAvatar)
}