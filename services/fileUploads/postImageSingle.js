// IMPORT MULTER FOR FILE UPLOAD
const multer = require('multer');
const fs = require('fs')

// DEFAULT MAXSIZE = 10 MB
const postImageSingleUpload = ( maxSize = 10485760, path = 'temp') => {
  const storage = multer.diskStorage({
    // WHERE THE FILE SHOULD BE STORED
    destination: function (req, file, cb) {
      var dir = './public/' + path;

      if (!fs.existsSync(dir))
          fs.mkdirSync(dir, { recursive: true });

      cb(null, 'public/' + path)
    },
    // LOGIC FOR SETTING THE FILENAME USED TO STORE THE FILE
    filename: function (req, file, cb) {
      console.log(file);
      const filename = Date.now() + '-' + file.originalname.trim().replaceAll(' ', '_')
      cb(null, filename)
    }
  })

  // LOGIC FOR IF THE FILE SHOULD BE ALLOWED TO BE UPLOADED OR NOT 
  const singleFileDelayedValidationFilter = (req, file, cb) => {
    const fileSize = parseInt(req.headers["content-length"])
    console.log('file size', fileSize);
    if(fileSize > maxSize){
      // if(fileSize > 100000){
        console.log('maxSize', maxSize, 'fileSize', fileSize);
        req.body.file_upload_status = 'file_upload_failed'
        return cb(null, false)
      }
  
    return cb(null, true)
  }

  // RETURN MULTER INSTANCE WITH NECESSARY OPTIONS
  return multer({
    storage: storage, 
    // limits: limits, 
    fileFilter: singleFileDelayedValidationFilter 
  }).single('image')
}

module.exports = { postImageSingleUpload }