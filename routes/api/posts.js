const express = require('express');
const router = express.Router();
const postController = require('../../controllers/postController');
const { postImageSingleUpload } = require('../../services/fileUploads/postImageSingle');

router.route('/')
    .get(postController.getAllPosts)
    .post(postImageSingleUpload('image', 'posts', 10485760 ), postController.createNewPost)

    // fieldsOnly.none()
    // postImageUpload.single('image')

router.route('/posts-with-user')
    .get(postController.getAllPostsWithUsers)

router.route('/:id')
    .get(postController.getPost)
    .put(postController.updatePost)
    .delete(postController.deletePost)

module.exports = router;