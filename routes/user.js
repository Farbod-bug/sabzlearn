const express = require('express');
const userController = require('./../controllers/user');
const authMiddleware = require('./../middlewares/auth');
const isAdminMiddleware = require('./../middlewares/isAdmin');

const router = express.Router();

router.route('/').get(authMiddleware, isAdminMiddleware, userController.getAll);
router.route('/:id').delete(authMiddleware, isAdminMiddleware, userController.removeUser);
router.route('/ban/:id').post(authMiddleware, isAdminMiddleware, userController.banUser);

module.exports = router;