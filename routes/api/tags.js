const express = require('express');
const router = express.Router();
const tagController = require('../../controllers/tagController');

router.route('/')
    .get(tagController.getAllTags)
    .post(tagController.createNewTag)

router.route('/tags-with-post')
    .get(tagController.getAllTagsWithPost)

router.route('/:id')
    .get(tagController.getTag)
    .put(tagController.updateTag)
    .delete(tagController.deleteTag)

module.exports = router;