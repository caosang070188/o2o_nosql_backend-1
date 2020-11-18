﻿const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const sendEmail = require('_helpers/send-email');
const db = require('_helpers/db');
const Role = require('_helpers/role');
const axios = require("axios");

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getById,
    create,
    update,
    delete: _delete,
    authorization
};

async function authenticate({ username, password, ipAddress }) {
    const res = await axios.get(`https://o2oviet.com/user-check-register.php?username=${username}&password=${password}`),
        { data } = res
    const account = await db.Account.findOne({ username });

    if (account) {
        account.avatar = data.avatar
        account.cover = data.cover
        account.userId = data.user_id
        account.userPassword = data.password
        account.background_image = data.background_image
        account.address = data.address
        account.working = data.working
        account.working_link = data.working_link
        account.about = data.about
        account.school = data.school
        account.gender = data.gender
        account.birthday = data.birthday
        account.language = data.language
        await account.save()
    }
    if (!account || !account.isVerified || !bcrypt.compareSync(password, account.passwordHash)) {
        throw 'Username or password is incorrect';
    }
    const token = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    await refreshToken.save();
    return {
        ...basicDetails(account),
        token,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    const { account } = refreshToken;

    // replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(account, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = generateJwtToken(account);

    // return basic details and tokens
    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);

    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin) {
    const res = await axios.post("https://o2oviet.com/user.php", {
        username: params.username,
        password: params.password,
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        phone_number: params.phoneNumber,
        gender: params.gender
    }),
        { data } = res

    if (res.status === 404) throw "Email or username was used!"
    // const res = await axios.get(`https://o2oviet.com/user-check-register.php?username=${params.username}&password=${params.password}`),
    //     { data } = res
    if (await db.Account.findOne({ username: params.username })) {
        // send already registered error in email to prevent account enumeration
        const tempUser = await db.Account.findOne({ username: params.username })
        return await sendAlreadyRegisteredEmail(tempUser.email, origin);
    }


    // create account object
    const account = new db.Account(params);

    account.avatar = data.avatar
    account.cover = data.cover
    account.userId = data.user_id
    account.userPassword = data.password
    account.background_image = data.background_image
    account.address = data.address
    account.working = data.working
    account.working_link = data.working_link
    account.about = data.about
    account.school = data.school
    account.gender = data.gender
    account.birthday = data.birthday
    account.language = data.language
    // first registered account is an admin
    account.role = Role.User;
    account.verificationToken = randomTokenString();

    // hash password
    account.passwordHash = hash(params.password);

    // save account
    await account.save();

    // send email
    await sendVerificationEmail(account, origin);
}

async function verifyEmail({ token }) {
    const account = await db.Account.findOne({ verificationToken: token })
    if (!account) throw 'Verification failed';

    account.verified = Date.now();
    account.verificationToken = undefined;
    await account.save();
}

async function forgotPassword({ email }, origin) {
    const account = await db.Account.findOne({ email });

    // always return ok response to prevent email enumeration
    if (!account) return;

    // create reset token that expires after 24 hours
    account.resetToken = {
        token: randomTokenString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    await account.save();

    // send email
    await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
    const account = await db.Account.findOne({
        'resetToken.token': token,
        'resetToken.expires': { $gt: Date.now() }
    });

    if (!account) throw 'Invalid token';
}

async function resetPassword({ token, password }) {
    const account = await db.Account.findOne({
        'resetToken.token': token,
        'resetToken.expires': { $gt: Date.now() }
    });

    if (!account) throw 'Invalid token';

    // update password and remove reset token
    account.passwordHash = hash(password);
    account.passwordReset = Date.now();
    account.resetToken = undefined;
    await account.save();
}

async function getAll() {
    const accounts = await db.Account.find();
    return accounts.map(x => basicDetails(x));
}

async function getById(id) {
    const account = await getAccount(id);
    return basicDetails(account);
}

async function create(params) {
    // validate
    if (await db.Account.findOne({ email: params.email })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    const account = new db.Account(params);
    account.verified = Date.now();

    // hash password
    account.passwordHash = hash(params.password);

    // save account
    await account.save();

    return basicDetails(account);
}

async function update(id, params) {
    const account = await getAccount(id);

    // validate (if email was changed)
    if (params.email && account.email !== params.email && await db.Account.findOne({ email: params.email })) {
        throw 'Email "' + params.email + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
        params.passwordHash = hash(params.password);
    }

    // copy params to account and save
    Object.assign(account, params);
    account.updated = Date.now();
    await account.save();

    return basicDetails(account);
}

async function _delete(id) {
    const account = await getAccount(id);
    await account.remove();
}

async function authorization(token) {
    const { email } = jwt.decode(token),
        account = await db.Account.findOne({ email })
    if (!account) throw "Authorization fail!"
    const verify = jwt.verify(token, config.secret)
    if (!verify) throw "Authorization fail!"
    return {
        email: account.email,
        username: account.username
    }
}

// helper functions

async function getAccount(id) {
    if (!db.isValidId(id)) throw 'Account not found';
    const account = await db.Account.findById(id);
    if (!account) throw 'Account not found';
    return account;
}

async function getRefreshToken(token) {
    const refreshToken = await db.RefreshToken.findOne({ token }).populate('account');
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

function hash(password) {
    return bcrypt.hashSync(password, 10);
}

function generateJwtToken(account) {
    // create a jwt token containing the account id that expires in 15 minutes
    return jwt.sign({ sub: account.id, id: account.id, email: account.email, username: account.username }, config.secret, { expiresIn: '365d' });
}

function generateRefreshToken(account, ipAddress) {
    // create a refresh token that expires in 7 days
    return new db.RefreshToken({
        account: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function basicDetails(account) {
    const { id, title, firstName, lastName, email, role, created, updated, isVerified, avatar, cover, background_image, address, working, working_link, about, school, gender, birthday, language } = account;
    return { id, title, firstName, lastName, email, role, created, updated, isVerified, avatar, cover, background_image, address, working, working_link, about, school, gender, birthday, language };
}

async function sendVerificationEmail(account, origin) {
    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Verify Email',
        html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               <p>Your code for verify account ${account.email} is <code style="font-size: 18px;">${account.verificationToken}</code></p>`
    });
}

async function sendAlreadyRegisteredEmail(email, origin) {
    let message;
    if (origin) {
        message = `<p>If you don't know your password please visit the <a href="${origin}/accounts/forgot-password">forgot password</a> page.</p>`;
    } else {
        message = `<p>If you don't know your password you can reset it via the <code>/accounts/forgot-password</code> api route.</p>`;
    }

    await sendEmail({
        to: email,
        subject: 'Sign-up Verification API - Email Already Registered',
        html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`
    });
}

async function sendPasswordResetEmail(account, origin) {
    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification API - Reset Password',
        html: `<h4>Reset Password Email</h4>
            <p>Your code for reset passwrod ${account.email} is <code style="font-size: 18px;">${account.resetToken.token}</code></p>`
    });
}