// IMPORT MULTER FOR FILE UPLOAD
const multer = require('multer');
const fs = require('fs')

// FILEFIELDNAME(required), DEFAULT PATH = 'temp' & DEFAULT MAXSIZE = 10 MB
const singleFileUpload = (fileFieldName, path = 'temp', maxSize = 10485760) => {
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
      const randomNum = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)
      const filename = Date.now() + randomNum + '-' + file.originalname.trim().replaceAll(' ', '_')
      cb(null, filename)
    }
  })

  // LOGIC FOR IF THE FILE SHOULD BE ALLOWED TO BE UPLOADED OR NOT 
  const singleFileDelayedValidationFilter = (req, file, cb) => {
    const fileSize = parseInt(req.headers["content-length"])
    // console.log('file size', fileSize);
    if(fileSize > maxSize){
      // if(fileSize > 100000){
        // console.log('maxSize', maxSize, 'fileSize', fileSize);
        req.body.file_upload_status = 'File too big to be uploaded to server'
        return cb(null, false)
      }
  
    return cb(null, true)
  }

  // RETURN MULTER INSTANCE WITH NECESSARY OPTIONS
  return multer({
    storage: storage, 
    // limits: limits, 
    fileFilter: singleFileDelayedValidationFilter 
  }).single(fileFieldName)
}

const deleteSingleReqFileHook = async (req) => {
  if(!req?.file?.path)
    return;

  const directoryPath = 'public/' +
                          req.body.file.path.substring(req.body.file.path.indexOf('\\') + 1, req.body.file.path.lastIndexOf('\\')) +
                          '/' +
                          req.body.file.filename

  if(req.body.file && fs.existsSync(directoryPath))
    await fs.unlinkSync(directoryPath);

  return;
}

const deleteSingleFile = async (req, filePath) => {
  if(!filePath)
    return;

  filePath = 'public/' + filePath.replace((process.env.FILE_BASE_URL === '' ? (req.protocol + '://' + req.get('host')) : process.env.FILE_BASE_URL) + '/', '')

  if(fs.existsSync(filePath))
    await fs.unlinkSync(filePath);

  return;
}

const fullPathSingleResolver = (req) => {
  const fullPath = (process.env.FILE_BASE_URL === '' ? (req.protocol + '://' + req.get('host')) : process.env.FILE_BASE_URL) + 
                    '/' +
                    req.body.file.path.substring(req.body.file.path.indexOf('\\') + 1, req.body.file.path.lastIndexOf('\\')) +
                    '/' +
                    req.body.file.filename;

  return fullPath;
}

module.exports = { singleFileUpload, deleteSingleReqFileHook, fullPathSingleResolver, deleteSingleFile }