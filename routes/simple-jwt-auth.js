const express = require('express');
const router = express.Router();
const simpleJWTAuthController = require('../controllers/simpleJWTAuthController');

router.post('/registration', simpleJWTAuthController.simpleJWTRegister)
router.post('/login', simpleJWTAuthController.simpleJWTLogin)

module.exports = router;