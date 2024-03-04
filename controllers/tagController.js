const Tag = require('../models/Tag');
const Post = require('../models/Post');
var mongoose = require('mongoose');
const { ZodError } = require('zod');
const { StoreTagSchema, UpdateTagSchema } = require('../validation/schemas/TagSchema');
const NotFoundException = require('../exceptions/NotFoundExceptions');
const CustomException = require('../exceptions/CustomException');
const BadRequestException = require('../exceptions/BadRequestException');

const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    if (!tags) throw new NotFoundException('No tags found')
    res.json(tags);
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

const getAllTagsWithPost = async (req, res) => {
  try {
    const tags = await Tag.find().select('text createdAt updatedAt').populate('post', 'text'); // ONLY SELECT CERTAIN FIELDS FROM 'Tag' AND 'Post'
    if (!tags) throw new NotFoundException('No tags found')
    res.json(tags);
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

const createNewTag = async (req, res) => {
  try {
    // VALIDATION
    const validatedData = StoreTagSchema.parse(req.body);

    // remove all duplicate ids
    validatedData.post_id = [...new Set(validatedData.post_id)]

    // check if all post ids provided are valid or not(i.e exists in DB)
    const posts = await Post.find({ _id: validatedData.post_id }).select('_id tags')
    if(posts.length < validatedData.post_id.length)
      throw new NotFoundException(`Post with ID ${validatedData.post_id} not found.`)

    const tag = await Tag.create({
      text : validatedData.text,
      post: validatedData.post_id
    });

    // push this tag id into posts which are in post_id array
    posts.map(async (post) => {
      if(!post.tags.includes(tag.id))
        post.tags = [...post.tags, tag.id]

      await Post.updateOne({ _id: post.id }, post);
    })

    res.status(201).json(tag);
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

const getTag = async (req, res) => {
  try {
    if (!req?.params?.id) throw new BadRequestException('Post ID required')

    if(!mongoose.Types.ObjectId.isValid(req.params.id)) throw new BadRequestException('Invalid tag id!')

    const tag = await Tag.findById((req?.params?.id)).exec();
    if (!tag) throw new NotFoundException(`Post ID ${req?.params?.id} not found`)
    res.json(tag);

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

const updateTag = async (req, res) => {
  try {
    if (!req?.params?.id)
      throw new NotFoundException('ID parameter is required.')

    // VALIDATION
    const validatedData = UpdateTagSchema.parse(req.body)

    // remove all duplicate ids
    validatedData.post_id = [...new Set(validatedData.post_id)]

    // check if all post ids provided are valid or not(i.e exists in DB)
    let posts = await Post.find({ _id: validatedData.post_id }).select('_id')
    if(posts.length < validatedData.post_id.length)
      throw new NotFoundException(`Post with ID ${validatedData.post_id} not found.`)

    // check if tag exists
    const tag = await Tag.findOne({ _id: req.params.id }).select('_id')
    if (!tag)
      throw new NotFoundException(`No tag matches ID ${req.params.id}.`)

    // pop/filter out tag ids from posts which already has this tag id
    const prev_posts = await Post.find({ tags: tag.id })
    prev_posts.map(async (prev_post) => {
      prev_post.tags = prev_post.tags.filter((prev_tag) => prev_tag !== tag.id)
      await Post.updateOne({ _id: prev_post.id }, { tags : prev_post.tags });
    })

    // refetching to refresh data, else, backdated data causes tags array to be incorrect for posts
    posts = await Post.find({ _id: validatedData.post_id }).select('_id tags')

    // push this tag id into posts which are in post_id array
    posts.map(async (post) => {
      if(!post.tags.includes(tag.id))
        post.tags = [...post.tags, tag.id]

      await Post.updateOne({ _id: post.id }, post);
    })

    if (validatedData?.text) tag.text = validatedData.text;
    if (validatedData?.post_id) tag.post = validatedData.post_id;
    // console.log(tag);
    const result = await tag.save();

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

const deleteTag = async (req, res) => {
  try {
    if (!req?.params?.id) throw new BadRequestException('Post ID required')

    const tag = await Tag.findOne({ _id: req.params.id }).exec();
    if (!tag)
        throw new NotFoundException(`Post with ID ${req.params.id} not found.`)

    // pop/filter out tag ids from posts which already has this tag id
    const prev_posts = await Post.find({ tags: tag.id })
    prev_posts.map(async (prev_post) => {
      prev_post.tags = prev_post.tags.filter((prev_tag) => prev_tag !== tag.id)
      await Post.updateOne({ _id: prev_post.id }, { tags : prev_post.tags });
    })

    //DETACH FROM POST
    let post = await Post.findOne({ tags: tag.id }).exec()
    // console.log('detach from old post before:', post);
    if(post){
      post.tags = post.tags.filter((found_tag) => {
        // console.log(found_tag, Tag.id, found_tag !== Tag.id, typeof(found_tag), typeof(Tag.id));
        return found_tag !== tag.id
      })
      // console.log('detach from old post after:', post, post.tags);
      await post.save()
    }

    const result = await Tag.deleteOne({ _id: req.params.id });
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
  getAllTags,
  getAllTagsWithPost,
  createNewTag,
  getTag,
  updateTag,
  deleteTag
}