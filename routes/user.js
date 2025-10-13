const express = require('express');
const userController = require('./../controllers/user');
const authMiddleware = require('./../middlewares/auth');
const isAdminMiddleware = require('./../middlewares/isAdmin');
const isOwnerMiddleware = require('./../middlewares/isOwner');
const requireVerified = require('./../middlewares/requireVerified');

const router = express.Router();

router
    .route('/')
    .get(authMiddleware, requireVerified(), isAdminMiddleware, userController.getAll)

router
    .route('/:id')
    .delete(authMiddleware, requireVerified(), isAdminMiddleware, userController.removeUser);

router
    .route('/ban/:id')
    .post(authMiddleware, requireVerified(), isAdminMiddleware, userController.banUser);

router
    .route('/role/:id')
    .post(authMiddleware, requireVerified(), isOwnerMiddleware, userController.changeRole);

router
    .route('/verify-email')
    .post(authMiddleware, userController.verifyEmail);

router
    .route('/resend-email-code')
    .post(authMiddleware, userController.resendEmailVerification);

router
    .route('/verify-phone')
    .post(authMiddleware, userController.verifyPhone);

router
    .route('/resend-phone-code')
    .post(authMiddleware, userController.resendPhoneVerification);

router
    .route('/change-password')
    .post(authMiddleware, requireVerified(), userController.changePassword);

router
    .route('/change-email/request')
    .post(authMiddleware, requireVerified(), userController.requestEmailChange);

router
    .route('/change-email/verify-old')
    .post(authMiddleware, requireVerified(), userController.verifyCurrentEmail);

router
    .route('/change-email/verify-new')
    .post(authMiddleware, requireVerified(), userController.verifyNewEmail);

module.exports = router;