const express = require('express');
const router = express.Router();
const postController = require('../../controllers/postController');
const { singleFileUpload } = require('../../services/fileUploads/singleFileUpload');
const { multipleFileUpload } = require('../../services/fileUploads/multipleFileUpload');

router.route('/')
    .get(postController.getAllPosts)
    .post(singleFileUpload('image', 'posts', 10485760 ), postController.createNewPost) // 10485760 === 10 MB

    // fieldsOnly.none()
    // postImageUpload.single('image')

router.route('/multiple')
    .post(multipleFileUpload( [{ name: 'images1', maxCount: 1 }, { name: 'images2', maxCount: 2 }], 'posts', 31457280 ), // 3145728031457280 === 30MB
            postController.createNewPostMultipleImages)

router.route('/posts-with-user')
    .get(postController.getAllPostsWithUsers)

router.route('/:id')
    .get(postController.getPost)
    .put(postController.updatePost)
    .delete(postController.deletePost)

module.exports = router;