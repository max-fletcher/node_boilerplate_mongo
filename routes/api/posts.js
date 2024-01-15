const express = require('express');
const router = express.Router();
const postController = require('../../controllers/postController');

router.route('/')
    .get(postController.getAllPosts)
    .post(postController.createNewPost)

router.route('/posts-with-user')
    .get(postController.getAllPostsWithUsers)

router.route('/:id')
    .get(postController.getPost)
    .put(postController.updatePost)
    .delete(postController.deletePost)

module.exports = router;