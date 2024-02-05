// IMPORT MULTER FOR FILE UPLOAD
const multer = require('multer');
const fs = require('fs')

// FILEFIELDNAME(required), DEFAULT PATH = 'temp' & DEFAULT MAXSIZE = 30 MB
const multipleFileUpload = (fileFieldName, path = 'temp', maxSize = 31457280) => {
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
      // console.log(file);
      const filename = Date.now() + '-' + file.originalname.trim().replaceAll(' ', '_')
      cb(null, filename)
    }
  })

  // LOGIC FOR IF THE FILE SHOULD BE ALLOWED TO BE UPLOADED OR NOT 
  const multipleFileDelayedValidationFilter = (req, file, cb) => {
    const fileSize = parseInt(req.headers["content-length"])
    // console.log('file size', fileSize);
    if(fileSize > maxSize){
      // if(fileSize > 100000){
        // console.log('maxSize', maxSize, 'fileSize', fileSize);
        req.body.file_upload_status = 'file_upload_failed'
        return cb(null, false)
      }
  
    return cb(null, true)
  }

  // RETURN MULTER INSTANCE WITH NECESSARY OPTIONS
  return multer({
    storage: storage, 
    // limits: limits, 
    fileFilter: multipleFileDelayedValidationFilter 
  }).fields(fileFieldName)
}

const deleteMultipleFileHook = async (req) => {
      // const directoryPath = 'public/temp/'
      // console.log(req.files);

      // IF EXISTS/NOT EMPTY CHECK
      Object.values(req.files).forEach(async (fields) => {
        // IF EXISTS/NOT EMPTY CHECK
        fields.map(async (field) => {

            console.log(field);

            const directoryPath = 'public/' +
            field.path.substring(field.path.indexOf('\\') + 1, field.path.lastIndexOf('\\')) +
            '/' +
            field.filename

            // IF EXISTS/NOT EMPTY CHECK. DUNNO WHAT TO DO WITH THIS...
            if(field)
              await fs.unlinkSync(directoryPath);
        })
      })

      return;
}

const fullPathMultipleResolver = (req) => {
  const fullPath = process.env.BASE_URL + 
                    '/' +
                    req.body.file.path.substring(req.body.file.path.indexOf('\\') + 1, req.body.file.path.lastIndexOf('\\')) +
                    '/' +
                    req.body.file.filename;

  return fullPath;
}

module.exports = { multipleFileUpload, deleteMultipleFileHook, fullPathMultipleResolver }