const express = require('express');
const router = express.Router();
const tag_MController = require('../../controllers/tag_MController');

router.route('/')
    .get(tag_MController.getAllTags)
    .post(tag_MController.createNewTag)

router.route('/tags-with-post')
    .get(tag_MController.getAllTagsWithPost)

router.route('/:id')
    .get(tag_MController.getTag)
    .put(tag_MController.updateTag)
    .delete(tag_MController.deleteTag)

module.exports = router;