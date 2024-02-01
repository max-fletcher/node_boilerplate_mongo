const express = require('express');
const router = express.Router();
const postController = require('../../controllers/postController');
// IMPORT MULTER FOR FILE UPLOAD
const multer = require('multer');
// STORAGE OPTIONS FOR MULTER
const storage = multer.diskStorage({
  // WHERE THE FILE SHOULD BE STORED
  destination: function (req, file, cb) {
    cb(null, 'public/posts/')
  },
  // LOGIC FOR SETTING THE FILENAME USED TO STORE THE FILE
  filename: function (req, file, cb) {
    console.log(file);
    const filename = Date.now() + '-' + file.originalname
    cb(null, filename)
  }
})

const limits = {
  fileSize: 28000, // 28 KB MAX
}

const allowedMimetypes = [ 'image/png', 'image/jpeg', 'image/jpg', 'image/webp' ]
const allowedExt = [ 'png', 'jpeg', 'jpg', 'webp' ]
const singleFileFilter = (req, file, cb) => {

  let file_errors = [];

  if (!allowedMimetypes.includes(file.mimetype)){
    console.log('mime');
    file_errors = [...file_errors, 'Incorrect mimetype.']
  }

  let match = false
  for(i = 0; i < allowedExt.length; i++) {
    if (file.originalname.match(allowedExt[i]))
      match = true
  }
  if(match === false){
    console.log('ext');
    file_errors = [...file_errors, 'Incorrect mimetype. Must be of type png, jpeg, jpg or webp']
  }

  const fileSize = parseInt(req.headers["content-length"])
  console.log('file size', fileSize);
  if(fileSize < 30000){
    console.log('size');
    file_errors = [...file_errors, 'File size must be less than 28KB.']
  }

  console.log('all_errors', file_errors);

  if(file_errors.length !== 0){
    req.body.file_errors = file_errors
    return cb(null, false)
  }

  return cb(null, true)
}
// CREATING THE MULTER INSTANCE
const postImageUpload = multer({ 
                  storage: storage, 
                  // limits: limits,
                  // LOGIC FOR IF THE FILE SHOULD BE ALLOWED TO BE UPLOADED OR NOT
                  fileFilter: singleFileFilter
              })

// const fieldsOnly = multer()

router.route('/')
    .get(postController.getAllPosts)
    .post(postImageUpload.array('image'), postController.createNewPost)

    // fieldsOnly.none()
    // postImageUpload.single('image')

router.route('/posts-with-user')
    .get(postController.getAllPostsWithUsers)

router.route('/:id')
    .get(postController.getPost)
    .put(postController.updatePost)
    .delete(postController.deletePost)

module.exports = router;