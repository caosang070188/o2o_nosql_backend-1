const express = require('express')
const router = express.Router()
const Joi = require('joi')
const validateRequest = require('_middleware/validate-request')
const authorize = require('_middleware/authorize')
const Role = require('_helpers/role')
const accountService = require('./account.service')
const db = require('_helpers/db')

// routes
router.post('/authenticate', authenticateSchema, authenticate)
router.post('/refresh-token', refreshToken)
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken)
router.post('/register', registerSchema, register)
router.post('/verify-email', verifyEmailSchema, verifyEmail)
router.post('/forgot-password', forgotPasswordSchema, forgotPassword)
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken)
router.post('/reset-password', resetPasswordSchema, resetPassword)
router.get('/', authorize(Role.Admin), getAll)
router.get('/:id', authorize(), getById)
router.post('/', authorize(Role.Admin), createSchema, create)
router.put('/:id', authorize(), updateSchema, update)
router.delete('/:id', authorize(), _delete)
router.post('/authorization/:token', authorizationSchema, authorization)
router.post("/device-token", authorize(Role.User), submitDeviceToken)
router.post("/test-fcm", authorize(), testFcm)


router.post("/notification", async (req, res, next) => {
    try {
        const { query } = req,
            username = req.query.username,
            firstName = req.query.firstName,
            lastName = req.query.lastName,
            recipient = req.query.recipient,
            user = await db.Account.findOne({ username: recipient }),
            index = Object.keys(query).findIndex(item => item === "sql")
        console.log(query)
        if (!user) return res.status(302).json({ message: "Tài khoản chưa đăng nhập trên di động!" })
        if (!query.sql.includes("(") || !query.sql.includes(")")) return res.status(302).json({ message: "SQL sai format" })
        let sql = ""
        Object.keys(query).slice(index, Object.keys(query).length).map(key => {
            if (key === "sql") {
                sql += query[key]
            } else {
                sql += `&${key}=${query[key]}`
            }
        })
        const lstField = sql.substring(sql.indexOf("(") + 1, sql.indexOf(")")).replaceAll("`", "").replace(/\s/g, '').split(","),
            subsql = sql.substring(sql.indexOf(")") + 1, sql.length),
            lstValue = subsql.substring(subsql.indexOf("(") + 1, subsql.indexOf(")")).replaceAll("'", "").replace(/\s/g, '').split(","),
            type = lstValue[lstField.findIndex(item => item === "type")],
            post = lstValue[lstField.findIndex(item => item === "post_id")],
            comment = lstValue[lstField.findIndex(item => item === "comment_id")],
            reply = lstValue[lstField.findIndex(item => item === "reply_id")],
            url = lstValue[lstField.findIndex(item => item === "url")]
        let title = "",
            body = ""
        const name = (Boolean(firstName) && Boolean(lastName)) ? `${firstName} ${lastName}` : username
        switch (type) {
            case "reaction":
                title = `${name} đã bày tỏ cảm xúc với bài viết của bạn`
                body = `Bạn hãy kiểm tra bài viết của bạn nha.`
                break
            case "invited_page":
                title = `${name} đã mời bạn thích trang.`
                body = `Bạn hãy nhanh tay đồng ý thích trang.`
                break
            case "comment":
                title = `${name} đã bình luận bài viết của bạn.`
                body = `Bạn hãy nhanh chóng phản hồi bình luận.`
                break
            case "fund_donate":
                title = `${name} đã ủng hộ quỹ.`
                body = `Bạn hãy nhanh kiểm tra tài khoản để xem hoàn thành kế hoạch chưa.`
                break
            case "accepted_request":
                title = `${name} đã đồng ý lời mời kết bạn của bạn.`
                body = `Bạn hãy nhanh chóng nhắn tin để làm quen.`
                break
            case "accept_group_chat_request":
                title = `${name} đã đồng ý thanh gia nhóm chat.`
                body = `Hãy nhanh tay tương tác với ${name} trong nhóm chat nha.`
                break
            case "liked_page":
                title = `${name} đã thích trang.`
                body = `Hãy đăng thêm thông tin hữu ích để nhiều người cùng like trang.`
                break
            default:
                title = `Bạn có một thông báo mới.`
                body = `Mở app để kiểm tra. Đừng bỏ lỡ thông báo này.`
                break
        }
        newNoti = new db.Notification({
            user: user._id,
            title,
            body,
            url,
            sql
        })
        await newNoti.save()
        if (user.deviceToken) {
            const bodyFCM = {
                to: user.deviceToken,
                notification: {
                    title: title,
                    body: body,
                    sound: "default",
                    click_action: "FLUTTER_NOTIFICATION_CLICK"
                },
                data: {
                    url: url
                },
                android: {
                    notification: {
                        channel_id: "channel_android_default"
                    }
                }
            }
            firebaseCloudMessage(bodyFCM, (err, data) => {
                if (err) return res.status(302).json({ message: "Có lỗi gì đó ở FCM" })
                res.status(200).json({ data, message: "Success!" })
            })
        } else {
            res.status(302).json({ message: `${name} chưa cấp quyền thông báo!` })
        }
    } catch (err) {
        res.status(302).json({ message: "Có lỗi gì đó!" })
    }
})

module.exports = router

function authenticateSchema(req, res, next) {
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    })
    validateRequest(req, next, schema)
}

function authenticate(req, res, next) {
    const { username, password } = req.body
    const ipAddress = req.ip
    accountService.authenticate({ username, password, ipAddress })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken)
            res.json(account)
        })
        .catch(err => {
            console.log(err)
            res.status(302).json({ message: "Tên đăng nhập hoặc mật khẩu không chính xác!" })
        })
}

function refreshToken(req, res, next) {
    const token = req.cookies.refreshToken
    const ipAddress = req.ip
    accountService.refreshToken({ token, ipAddress })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken)
            res.json(account)
        })
        .catch(next)
}

function revokeTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().empty('')
    })
    validateRequest(req, next, schema)
}

function revokeToken(req, res, next) {
    // accept token from request body or cookie
    const token = req.body.token || req.cookies.refreshToken
    const ipAddress = req.ip

    if (!token) return res.status(400).json({ message: 'Bắt buộc phải có code nha bạn.' })

    // users can revoke their own tokens and admins can revoke any tokens
    if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    accountService.revokeToken({ token, ipAddress })
        .then(() => res.json({ message: 'Code đã được thu hồi.' }))
        .catch(next)
}

function registerSchema(req, res, next) {
    const schema = Joi.object({
        title: Joi.string().optional(),
        firstName: Joi.string().optional(),
        lastName: Joi.string().optional(),
        username: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        acceptTerms: Joi.boolean().valid(true).required(),
        phoneNumber: Joi.string().optional(),
        gender: Joi.string().optional()
    })
    validateRequest(req, next, schema)
}

function register(req, res, next) {
    accountService.register(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Đăng kí thành công rồi. Bạn vui lòng kiểm tra email để xác thực tài khoản nha.' }))
        .catch((err) => {
            if (err === "Email or tên đăng nhập đã được sử dụng!") {
                res.status(302).json({ message: err })
            } else {
                res.status(302).json({ message: "Có lỗi gì đó rồi. Bạn vui lòng kiểm tra lại giúp chúng tớ nha!" })
            }
        })
}

function verifyEmailSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    })
    validateRequest(req, next, schema)
}

function verifyEmail(req, res, next) {
    accountService.verifyEmail(req.body)
        .then(() => res.json({ message: 'Xác thực thành công. Bây giờ bạn có thể đăng nhập rồi.' }))
        .catch(next)
}

function forgotPasswordSchema(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required()
    })
    validateRequest(req, next, schema)
}

function forgotPassword(req, res, next) {
    accountService.forgotPassword(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Bạn vui lòng kiểm tra email nha. Code đã được gửi tới email của bạn.' }))
        .catch(next)
}

function validateResetTokenSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
    })
    validateRequest(req, next, schema)
}

function validateResetToken(req, res, next) {
    accountService.validateResetToken(req.body)
        .then(() => res.json({ message: 'Code đã hết hạn' }))
        .catch(next)
}

function resetPasswordSchema(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    })
    validateRequest(req, next, schema)
}

function resetPassword(req, res, next) {
    accountService.resetPassword(req.body)
        .then(() => res.json({ message: 'Mật khẩu đã được thay đổi. Bây giờ bạn có thể đăng nhập rồi.' }))
        .catch(next)
}

function getAll(req, res, next) {
    accountService.getAll()
        .then(accounts => res.json(accounts))
        .catch(next)
}

function getById(req, res, next) {
    // users can get their own account and admins can get any account
    if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Chưa được xác thực.' })
    }

    accountService.getById(req.params.id)
        .then(account => account ? res.json(account) : res.sendStatus(404))
        .catch(next)
}

function createSchema(req, res, next) {
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        role: Joi.string().valid(Role.Admin, Role.User).required()
    })
    validateRequest(req, next, schema)
}

function create(req, res, next) {
    accountService.create(req.body)
        .then(account => res.json(account))
        .catch(next)
}

function updateSchema(req, res, next) {
    const schemaRules = {
        title: Joi.string().empty(''),
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        email: Joi.string().email().empty(''),
        password: Joi.string().min(6).empty(''),
        confirmPassword: Joi.string().valid(Joi.ref('password')).empty('')
    }

    // only admins can update role
    if (req.user.role === Role.Admin) {
        schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('')
    }

    const schema = Joi.object(schemaRules).with('password', 'confirmPassword')
    validateRequest(req, next, schema)
}

function update(req, res, next) {
    // users can update their own account and admins can update any account
    if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    accountService.update(req.params.id, req.body)
        .then(account => res.json(account))
        .catch(next)
}

function _delete(req, res, next) {
    // users can delete their own account and admins can delete any account
    if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    accountService.delete(req.params.id)
        .then(() => res.json({ message: 'Account deleted successfully' }))
        .catch(next)
}

// helper functions

function setTokenCookie(res, token) {
    // create cookie with refresh token that expires in 7 days
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
    res.cookie('refreshToken', token, cookieOptions)
}

function authorizationSchema(req, res, next) {
    const schema = Joi.object({})
    validateRequest(req, next, schema)
}

function notificationSchema(req, res, next) {
    const schema = Joi.object({})
    validateRequest(req, next, schema)
}

function authorization(req, res, next) {
    const { params: { token } } = req
    accountService.authorization(token)
        .then(result => res.status(200).json({ email: result.email, username: result.username, message: "Authorization successfull!" }))
        .catch(next)
}

function submitDeviceToken(req, res, next) {
    accountService.submitDeviceToken(req.body.token, req.user.username)
        .then(_ => res.status(200).json("Submit device token success!"))
        .catch(next)
}

function testFcm(req, res, next) {
    accountService.testNotification(req.body.title, req.body.body, req.user.username)
        .then(result => res.status(200).json("Success Test!"))
        .catch(next)
}
