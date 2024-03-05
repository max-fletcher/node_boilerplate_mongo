const Post = require('../models/Post');
const User = require('../models/User');
var mongoose = require('mongoose');
const { ZodError } = require('zod');
const { StorePostSchema, StorePostMultipleImageSchema, UpdatePostSchema, UpdatePostMultipleImageSchema } = require('../validation/schemas/PostSchema');
const NotFoundException = require('../exceptions/NotFoundExceptions');
const CustomException = require('../exceptions/CustomException');
const BadRequestException = require('../exceptions/BadRequestException');
const { deleteSingleReqFileHook, fullPathSingleResolver, deleteSingleFile } = require('../services/fileUploads/singleFileUploadService');
const { deleteMultipleReqFileHook, fullPathMultipleResolver, deleteMultipleFile } = require('../services/fileUploads/multipleFileUploadService');
const { paginate } = require('../utils/helpers');
const Tag = require('../models/Tag');
const { formattedResponse } = require('../utils/response');

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    if (!posts) throw new NotFoundException('No posts found')
    res.json(posts);
  } catch (error) {
    // console.log(error);
    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format()})
    }
    else if(error instanceof CustomException || error instanceof NotFoundException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const getAllPostsWithpagination = async (req, res) => {
  try { 
    const { search } = req.query
    const page = (req.query.page && req.query.page >= 1) ? parseInt(req.query.page) : 1
    const limit = (req.query.limit && req.query.limit >= 1) ? parseInt(req.query.limit) : 10

    // FOR CHECKING QUERY STRING
    // return res.json({ page: page, limit: limit, 
    //                   path: req.protocol + '://' + req.get('host') + req.originalUrl + req.path.substring(0, req.path - 1),
    //                   orig: req.originalUrl + req.path.substring(0, req.path - 1),
    //                   inter: `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}${req.path.substring(0, req.path - 1)}?page=${(parseInt(page)+1)}limit=${limit}search=${search}`,
    //                   ternary: (process.env.FILE_BASE_URL === '' ? (req.protocol + '://' + req.get('host')) : process.env.FILE_BASE_URL)
    //                 })

    // MONGODB CAN'T DO NEITHER JOINS NOR SUBQUERIES SO WE HAVE TO DO SOMETHING THIS, WHICH IS A ROUNDABOUT THING TO FILTER PARENT BY CHILD CONSTRAINTS - //

    // take tag array that doesn't have 3 as part of 'text' field string and push it inside 'with_tag_ids'
    const tag_with_string_match = await Tag.find({ text: { $regex: '.*' + '3' + '.*' } }).select('_id').exec()
    let with_tag_ids = []
    tag_with_string_match.map((tag) => {
      with_tag_ids = [...with_tag_ids, tag._id]
    })

    // ($nin = not in array, $eq = equal, $ne = not equal, $gte = greater than equal, $gt = greater than etc.)
    // Object. Conditions used for filtering data in DB. Should look like this: occupation: /host/, 'name.last': 'Ghost', age: { $gt: 17, $lt: 66 }, likes: { $in: ['vaporizing', 'talking'] }.
    const options = {
                      where: {
                        tags: { $nin: with_tag_ids } // find posts that doesn't have 'with_tag_ids' in its 'tags' array field
                        // text: /Post 3/i
                        // count: { $gt : 30 }
                      },
                      // String. For selecting fields from a database
                      select: '_id text user comments images createdAt count',
                      // Array of objects. Each object has structure: { path: 'fans', match: { age: { $gte: 21 } }, select: 'name -_id' } etc.
                      relations: [
                        {
                            path: 'tags',
                            // match: { text : { $regex: '.*' + 'Bruh' + '.*' } }, // For search using LIKE clause i.e - text LIKE "Bruh"
                            // match: { text : { $eq: 'Tag 3 Bruh' } }, // For search using EQUAL clause i.e - text EQUAL "Tag 3 Bruh"
                            select: '_id text '
                        },
                        {
                          path: 'comments',
                          // match: { text : { $eq: 'Comment 1 Bruh' } }, // For search using EQUAL clause i.e - text EQUAL "Comment 1 Bruh"
                          select: '_id text '
                        }
                      ],
                      // Object. For custom search in base model. Same as options.where
                      search: {
                        text: { $regex: '.*' + search + '.*' }
                      }
                    }
    // return res.json({ options: options })

    const { pageDataCount, totalDataCount, currentPage, next, previous, data } = await paginate(req, Post, options, limit, page)

    return formattedResponse(res, 200, 'Posts Found', {
      pageDataCount, 
      totalDataCount, 
      currentPage, 
      next, 
      previous, 
      data
    })
  } catch (error) {
    console.log(error);
    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format()})
    }
    else if(error instanceof CustomException || error instanceof NotFoundException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const getAllPostsWithUsers = async (req, res) => {
  try {
    const posts = await Post.find().select('text createdAt updatedAt').populate('user', 'email password').populate('tags'); // ONLY SELECT CERTAIN FIELDS FROM 'Post' AND 'User'
    if (!posts) throw new NotFoundException('No posts found')
    res.json(posts);
  } catch (error) {
    // console.log(error);
    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format()})
    }
    else if(error instanceof CustomException || error instanceof NotFoundException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const createNewPost = async (req, res) => {
  try {
    /////// IF FILE IS NOT UPLOADED, EARLY RETURN
    if(req.body.file_upload_status)
      throw new BadRequestException(req.body.file_upload_status)

    req.body.file = req.file

    // VALIDATION
    const validatedData = StorePostSchema.parse(req.body)
    // return res.status(404).json({ body:req.body, data: validatedData })

    const user = await User.findById(validatedData.user_id)

    if(!user)
      throw new NotFoundException(`User with ID ${validatedData.user_id} not found.`)

    // fullPathSingleResolver JUST RETURN A STRING BASED ON WHAT IS IN req.body.file
    const fullPath = fullPathSingleResolver(req)
    const images = [fullPath]

    const post = await Post.create({
      text : validatedData.text,
      user: validatedData.user_id,
      images: images
    });

    user.posts.push(post._id)
    const result = await user.save()

    res.status(201).json(post);
  } catch (error) {
    // console.log(error);
    // DELETE IMAGE FILE IF EXCEPTIONS/ERRROS ARISES. THE PATH IS WITH RESPECT TO THE ROOT OF THE PROJECT.
    await deleteSingleReqFileHook(req)

    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format() })
    }
    else if(error instanceof CustomException || error instanceof NotFoundException || error instanceof BadRequestException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const createNewPostMultipleImages = async (req, res) => {
  try {
    /////// IF FILE IS NOT UPLOADED, EARLY RETURN
    if(req.body.file_upload_status)
      throw new BadRequestException(req.body.file_upload_status)

    req.body.files = req.files

    // VALIDATION
    const validatedData = StorePostMultipleImageSchema.parse(req.body)
    // return res.status(404).json({ body:req.body, data: validatedData })

    const user = await User.findById(validatedData.user_id)

    if(!user)
      throw new NotFoundException(`User with ID ${validatedData.user_id} not found.`)

    // postImagePaths RETURN ALL FULLPATHS OF FILES AS AN ARRAY
    const postImagePaths = fullPathMultipleResolver(req);
    const images = [...postImagePaths.images1, ...postImagePaths.images2]

    const post = await Post.create({
      text : validatedData.text,
      user: validatedData.user_id,
      images: images
    });

    user.posts.push(post._id)
    const result = await user.save()

    res.status(201).json(post);
  } catch (error) {
    // console.log(error);
    // DELETE IMAGE FILE IF EXCEPTIONS/ERRROS ARISES. THE PATH IS WITH RESPECT TO THE ROOT OF THE PROJECT.
    await deleteMultipleReqFileHook(req)

    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format() })
    }
    else if(error instanceof CustomException || error instanceof NotFoundException || error instanceof BadRequestException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const getPost = async (req, res) => {
  try {
    if (!req?.params?.id) throw new BadRequestException('Post ID required')

    if(!mongoose.Types.ObjectId.isValid(req.params.id)) throw new BadRequestException('Invalid post id!')

    const post = await Post.findById((req?.params?.id)).exec();
    if (!post) throw new NotFoundException(`Post ID ${req?.params?.id} not found`)
    res.json(post);

  } catch (error) {
    console.log(error);
    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format()})
    }
    else if(error instanceof CustomException || error instanceof NotFoundException || error instanceof BadRequestException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const updatePost = async (req, res) => {
  try {
    if (!req?.params?.id)
      throw new NotFoundException('ID parameter is required.')

    /////// IF FILE IS NOT UPLOADED, EARLY RETURN
    if(req.body.file_upload_status)
      throw new BadRequestException(req.body.file_upload_status)

    req.body.file = req.file

    // VALIDATION
    const validatedData = UpdatePostSchema.parse(req.body);
    // return res.json({ data: validatedData})

    const user = await User.findById(validatedData.user_id)

    if(!user)
      throw new NotFoundException(`User with ID ${validatedData.user_id} not found.`)

    const post = await Post.findOne({ _id: req.params.id }).exec();

    if (!post)
      throw new NotFoundException(`No post matches ID ${req.params.id}.`)

    // PUT CHECKS FOR IF THE NEW OR OLD USER IS NOT FOUND
    if(validatedData.user_id && validatedData.user_id !== post.user){
      //DETACH FROM OLD USER
      let user = await User.findOne({ posts: post.id }).exec()
      // console.log('detach from old user before:', user);
      if(user){
        user.posts = user.posts.filter((found_post) => {
          // console.log(found_post, post.id, found_post !== post.id, typeof(found_post), typeof(post.id));
          return found_post !== post.id
        })
        // console.log('detach from old user after:', user, user.posts);
        await user.save()
      }

      // ATTACH TO NEW USER
      user = await User.findOne({ _id: validatedData.user_id }).exec()
      if(user){
        // console.log('attach to new user before:', user);
        user.posts = [...user.posts, post.id]
        // console.log('attach to new user after:', user);
        await user.save()
      }
    }

    await deleteSingleFile(req, post.images[0])

    const fullPath = fullPathSingleResolver(req)
    const images = [fullPath]

    if (validatedData?.text) post.text = validatedData.text
    if (validatedData?.user_id) post.user = validatedData.user_id
    post.images = images
    // console.log(post);
    const result = await post.save();

    res.json(result);
  } catch (error) {
    // console.log(error);
    // DELETE IMAGE FILE IF EXCEPTIONS/ERRROS ARISES. THE PATH IS WITH RESPECT TO THE ROOT OF THE PROJECT.
    await deleteSingleReqFileHook(req)

    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format()})
    }
    else if(error instanceof CustomException || error instanceof NotFoundException || error instanceof BadRequestException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const updatePostWithMultipleImages = async (req, res) => {
  try {
    if (!req?.params?.id)
      throw new NotFoundException('ID parameter is required.')

    /////// IF FILE IS NOT UPLOADED, EARLY RETURN
    if(req.body.file_upload_status)
      throw new BadRequestException(req.body.file_upload_status)

    req.body.files = req.files

    // VALIDATION
    const validatedData = UpdatePostMultipleImageSchema.parse(req.body);
    // return res.status(404).json({ body:req.body, data: validatedData })

    const userExists = await User.findById(validatedData.user_id)

    if(!userExists)
      throw new NotFoundException(`User with ID ${validatedData.user_id} not found.`)

    const post = await Post.findOne({ _id: req.params.id }).exec();

    if (!post)
      throw new NotFoundException(`No post matches ID ${req.params.id}.`)

    // PUT CHECKS FOR IF THE NEW OR OLD USER IS NOT FOUND
    if(validatedData.user_id && validatedData.user_id !== post.user){
      //DETACH FROM OLD USER
      let user = await User.findOne({ posts: post.id }).exec()
      // console.log('detach from old user before:', user);
      if(user){
        user.posts = user.posts.filter((found_post) => {
          // console.log(found_post, post.id, found_post !== post.id, typeof(found_post), typeof(post.id));
          return found_post !== post.id
        })
        // console.log('detach from old user after:', user, user.posts);
        await user.save()
      }

      // ATTACH TO NEW USER
      if(userExists){
        // console.log('attach to new user before:', user);
        user.posts = [...user.posts, post.id]
        // console.log('attach to new user after:', user);
        await user.save()
      }
    }

    //DELETE ALL OLD FILES
    deleteMultipleFile(req, post.images)

    // postImagePaths RETURN ALL FULLPATHS OF FILES AS AN ARRAY
    const postImagePaths = fullPathMultipleResolver(req)
    const images = [...postImagePaths.images1, ...postImagePaths.images2]

    if (validatedData?.text) post.text = validatedData.text
    if (validatedData?.user_id) post.user = validatedData.user_id
    post.images = images

    // console.log(post);
    const result = await post.save();

    res.json(result);

  } catch (error) {
    // console.log(error);
    // DELETE IMAGE FILE IF EXCEPTIONS/ERRROS ARISES. THE PATH IS WITH RESPECT TO THE ROOT OF THE PROJECT.
    await deleteMultipleReqFileHook(req)

    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format()})
    }
    else if(error instanceof CustomException || error instanceof NotFoundException || error instanceof BadRequestException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

const deletePost = async (req, res) => {
  try {
    if (!req?.params?.id) throw new BadRequestException('Post ID required')

    const post = await Post.findOne({ _id: req.params.id }).exec();
    if (!post)
        throw new NotFoundException(`Post with ID ${req.params.id} not found.`)

    //DETACH FROM OLD USER
    let user = await User.findOne({ posts: post.id }).exec()
    // console.log('detach from old user before:', user);
    if(user){
      user.posts = user.posts.filter((found_post) => {
        // console.log(found_post, post.id, found_post !== post.id, typeof(found_post), typeof(post.id));
        return found_post !== post.id
      })
      // console.log('detach from old user after:', user, user.posts);
      await user.save()
    }

    deleteMultipleFile(req, post.images)

    const result = await Post.deleteOne({ _id: req.params.id });
    res.json(result);
  } catch (error) {
    console.log(error);
    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format()})
    }
    else if(error instanceof CustomException || error instanceof NotFoundException || error instanceof BadRequestException){
      return res.status(error.status).json({ type: 'exception', error : error.message })
    }
    else{
      return res.status(500).json({ type: 'exception', error : 'Something went wrong! Please try again.'})
    }
  }
}

module.exports = {
  getAllPosts,
  getAllPostsWithpagination,
  getAllPostsWithUsers,
  createNewPost,
  createNewPostMultipleImages,
  getPost,
  updatePost,
  updatePostWithMultipleImages,
  deletePost
}