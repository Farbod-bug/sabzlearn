const express = require('express');
const userController = require('./../controllers/user');
const authMiddleware = require('./../middlewares/auth');
const isAdminMiddleware = require('./../middlewares/isAdmin');
const isOwnerMiddleware = require('./../middlewares/isOwner');

const router = express.Router();

router
    .route('/')
    .get(authMiddleware, isAdminMiddleware, userController.getAll)
    .put(authMiddleware, userController.updateUser);

router
    .route('/:id')
    .delete(authMiddleware, isAdminMiddleware, userController.removeUser);

router
    .route('/ban/:id')
    .post(authMiddleware, isAdminMiddleware, userController.banUser);

router
    .route('/role/:id')
    .post(authMiddleware, isOwnerMiddleware, userController.changeRole);

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

module.exports = router;