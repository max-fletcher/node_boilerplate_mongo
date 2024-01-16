const express = require('express');
const router = express.Router();
const simpleJWTAuthController = require('../controllers/simpleJWTAuthController');

router.post('/register', simpleJWTAuthController.simpleJWTRegister)
router.post('/login', simpleJWTAuthController.simpleJWTLogin)
router.get('/get-auth-user', simpleJWTAuthController.getAuthUser)
router.get('/logout', simpleJWTAuthController.simpleJWTLogout)

module.exports = router;