const express = require('express');
const router = express.Router();
const commentController = require('../../controllers/commentController');

router.route('/')
    .get(commentController.getAllComments)
    .post(commentController.createNewComment)

router.route('/comments-with-post')
    .get(commentController.getAllCommentsWithPost)

router.route('/:id')
    .get(commentController.getComment)
    .put(commentController.updateComment)
    .delete(commentController.deleteComment)

module.exports = router;