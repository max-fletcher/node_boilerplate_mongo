const express = require('express');
const router = express.Router();
const usersController = require('../../controllers/usersController');
// const ROLES_LIST = require('../../config/roles_list');
// const verifyRoles = require('../../middleware/verifyRoles');

router.route('/')
    .get(usersController.getAllUsers)

router.route('/users-with-posts')
    .get(usersController.getAllUsersWithPosts)

router.route('/users-with-posts-and-comments')
    .get(usersController.getAllUsersWithPostsAndComments)

router.route('/:id')
    .get(usersController.getUser)
    .delete(usersController.deleteUser)

module.exports = router;