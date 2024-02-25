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
      const randomNum = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)
      const filename = Date.now() + randomNum + '-' + file.originalname.trim().replaceAll(' ', '_')
      cb(null, filename)
    }
  })

  // LOGIC FOR IF THE FILE SHOULD BE ALLOWED TO BE UPLOADED OR NOT 
  const multipleFileDelayedValidationFilter = (req, file, cb) => {
    const fileSize = parseInt(req.headers["content-length"])
    // console.log('file size', fileSize, file, req.files);
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
    fileFilter: multipleFileDelayedValidationFilter 
  }).fields(fileFieldName)
}

const deleteMultipleReqFileHook = async (req) => {
  if(!Object.keys(req.files).length)
    return;

  // IF EXISTS/NOT EMPTY CHECK
  Object.values(req.files).forEach(async (fields) => {
    // IF EXISTS/NOT EMPTY CHECK
    fields.map(async (field) => {
        const directoryPath = 'public/' +
                                field.path.substring(field.path.indexOf('\\') + 1, field.path.lastIndexOf('\\')) +
                                '/' +
                                field.filename

        // IF EXISTS/NOT EMPTY CHECK. DUNNO WHAT TO DO WITH THIS...
        if(field && fs.existsSync(directoryPath)){
          await fs.unlinkSync(directoryPath);
        }
    })
  })

  return;
}

const deleteMultipleFile = async (filePaths) => {
  if(!filePaths)
    return;

  filePaths.map(async (filePath) => {
    tempFilePath = 'public/' + filePath.replace(process.env.BASE_URL + '/', '')
    if(fs.existsSync(tempFilePath))
      await fs.unlinkSync(tempFilePath);
  })

  return;
}

const fullPathMultipleResolver = (req) => {
  if(!Object.keys(req.files).length)
    return;

  formatted_paths = {};

  Object.entries(req.files).map(async(element) => {
    let paths = [];
    element[1].map((fileDes) => {
      paths = [process.env.BASE_URL + 
              '/' +
              fileDes.path.substring(fileDes.path.indexOf('\\') + 1, fileDes.path.lastIndexOf('\\')) +
              '/' +
              fileDes.filename, ...paths]
    })

    formatted_paths[element[0]] = paths
  })

  return formatted_paths;
}

module.exports = { multipleFileUpload, deleteMultipleFile, deleteMultipleReqFileHook, fullPathMultipleResolver }