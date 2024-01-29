const Comment = require('../models/Comment');
const Post = require('../models/Post');
var mongoose = require('mongoose');
const { ZodError } = require('zod');
const { StoreCommentSchema, UpdateCommentSchema } = require('../validation/schemas/CommentSchema');
const NotFoundException = require('../exceptions/NotFoundExceptions');
const CustomException = require('../exceptions/CustomException');
const BadRequestException = require('../exceptions/BadRequestException');

const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find();
    if (!comments) throw new NotFoundException('No comments found')
    res.json(comments);
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

const getAllCommentsWithPost = async (req, res) => {
  try {
    const comments = await Comment.find().select('text createdAt updatedAt').populate('post', 'text'); // ONLY SELECT CERTAIN FIELDS FROM 'Comment' AND 'Post'
    if (!comments) throw new NotFoundException('No comments found')
    res.json(comments);
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

const createNewComment = async (req, res) => {
  try {
    // VALIDATION
    const validatedData = StoreCommentSchema.parse(req.body);
    // return res.json({ data: validatedData})

    const post = await Post.findById(validatedData.post_id)

    if(!post)
      throw new NotFoundException(`Comment with ID ${validatedData.post_id} not found.`)

    const comment = await Comment.create({
      text : validatedData.text,
      post: validatedData.post_id
    });

    post.comments.push(comment._id)
    const result = await post.save()

    res.status(201).json(comment);
  } catch (error) {
    console.log(error);
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

const getComment = async (req, res) => {
  try {
    if (!req?.params?.id) throw new BadRequestException('Post ID required')

    if(!mongoose.Types.ObjectId.isValid(req.params.id)) throw new BadRequestException('Invalid comment id!')

    const comment = await Comment.findById((req?.params?.id)).exec();
    if (!comment) throw new NotFoundException(`Post ID ${validatedDataid} not found`)
    res.json(comment);

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

const updateComment = async (req, res) => {
  try {
    if (!req?.params?.id)
      throw new NotFoundException('ID parameter is required.')

    // VALIDATION
    const validatedData = UpdateCommentSchema.parse(req.body)
    // return res.json({ data: validatedData})

    const post = await Post.findById(validatedData.post_id)

    if(!post)
      throw new NotFoundException(`Post with ID ${validatedData.post_id} not found.`)

    const comment = await Comment.findOne({ _id: req.params.id }).exec()

    if (!comment)
      throw new NotFoundException(`No comment matches ID ${req.params.id}.`)

    // PUT CHECKS FOR IF THE NEW OR OLD POST IS NOT FOUND
    if(validatedData.post_id && validatedData.post_id !== comment.post){
      //DETACH FROM OLD POST
      let post = await Post.findOne({ comments: comment.id }).exec()
      if(post){
        // console.log('detach from old post before:', post);
        post.comments = post.comments.filter((found_comment) => {
          // console.log(found_comment, Comment.id, found_comment !== Comment.id, typeof(found_comment), typeof(Comment.id));
          return found_comment !== comment.id
        })
        // console.log('detach from old post after:', post, post.comments);
        post.save()
      }

      // ATTACH TO NEW POST
      post = await Post.findOne({ _id: validatedData.post_id }).exec()
      // console.log('attach to new user before:', user);
      post.comments = [...post.comments, comment.id]
      // console.log('attach to new user after:', post);
      post.save()
    }

    if (validatedData?.text) comment.text = validatedData.text;
    if (validatedData?.post_id) comment.user = validatedData.post_id;
    // console.log(comment);
    const result = await comment.save();

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

const deleteComment = async (req, res) => {
  try {
    if (!req?.params?.id) throw new BadRequestException('Post ID required')

    const comment = await Comment.findOne({ _id: req.params.id }).exec();
    if (!comment)
        throw new NotFoundException(`Post with ID ${req.params.id} not found.`)

    //DETACH FROM POST
    let post = await Post.findOne({ comments: comment.id }).exec()
    // console.log('detach from old post before:', post);
    if(post){
      post.comments = post.comments.filter((found_comment) => {
        // console.log(found_comment, Comment.id, found_comment !== Comment.id, typeof(found_comment), typeof(Comment.id));
        return found_comment !== comment.id
      })
      // console.log('detach from old post after:', post, post.comments);
      post.save()
    }

    const result = await Comment.deleteOne({ _id: req.params.id });
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
  getAllComments,
  getAllCommentsWithPost,
  createNewComment,
  getComment,
  updateComment,
  deleteComment
}