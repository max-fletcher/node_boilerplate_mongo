const Post = require('../models/Post');
const User = require('../models/User');
var mongoose = require('mongoose');
const { ZodError } = require('zod');
const { StorePostSchema, UpdatePostSchema } = require('../validation/schemas/PostSchema');
const NotFoundException = require('../exceptions/NotFoundExceptions');
const CustomException = require('../exceptions/CustomException');

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    if (!posts) throw new NotFoundException('No posts found')
    res.json(posts);
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
    const posts = await Post.find().select('text createdAt updatedAt').populate('user', 'email password'); // ONLY SELECT CERTAIN FIELDS FROM 'Post' AND 'User'
    if (!posts) throw new NotFoundException('No posts found')
    res.json(posts);
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

const createNewPost = async (req, res) => {
  try {
    // VALIDATION
    const validatedData = StorePostSchema.parse(req.body);
    // return res.json({ data: validatedData})

    const user = await User.findById(validatedData.user_id)

    if(!user)
      throw new NotFoundException(`User with ID ${validatedData.user_id} not found.`)

    const post = await Post.create({
      text : validatedData.text,
      user: validatedData.user_id
    });

    user.posts.push(post._id)
    const result = await user.save()

    res.status(201).json(post);
  } catch (error) {
    // console.log(error);
    if(error instanceof ZodError){
      return res.status(422).json({ type: 'validation', error : error.format() })
    }
    else if(error instanceof CustomException || error instanceof NotFoundException){
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
    if (!post) throw new NotFoundException(`Post ID ${validatedDataid} not found`)
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
      user.posts = user.posts.filter((found_post) => {
        // console.log(found_post, post.id, found_post !== post.id, typeof(found_post), typeof(post.id));
        return found_post !== post.id
      })
      // console.log('detach from old user after:', user, user.posts);
      user.save()

      // ATTACH TO NEW USER
      user = await User.findOne({ _id: validatedData.user_id }).exec()
      // console.log('attach to new user before:', user);
      user.posts = [...user.posts, post.id]
      // console.log('attach to new user after:', user);
      user.save()
    }

    if (validatedData?.text) post.text = validatedData.text;
    if (validatedData?.user_id) post.user = validatedData.user_id;
    // console.log(post);
    const result = await post.save();

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

const deletePost = async (req, res) => {
  try {
    if (!req?.params?.id) throw new BadRequestException('Post ID required')

    const post = await Post.findOne({ _id: req.params.id }).exec();
    if (!post)
        throw new NotFoundException(`Post with ID ${req.params.id} not found.`)
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
  getAllPostsWithUsers,
  createNewPost,
  getPost,
  updatePost,
  deletePost
}