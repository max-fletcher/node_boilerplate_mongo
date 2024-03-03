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
    // return res.json({ data: validatedData})

    const post = await Post.findById(validatedData.post_id)

    if(!post)
      throw new NotFoundException(`Tag with ID ${validatedData.post_id} not found.`)

    const tag = await Tag.create({
      text : validatedData.text,
      post: validatedData.post_id
    });

    post.tags.push(tag._id)
    const result = await post.save()

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

    const posts = await Post.find({ _id: validatedData.post_id }).select('_id tags')

    // check if all post ids provided are valid or not
    if(posts.length < validatedData.post_id.length)
      throw new NotFoundException(`Post with ID ${validatedData.post_id} not found.`)

    const tag = await Tag.findOne({ _id: req.params.id }).populate('post').exec()

    if (!tag)
      throw new NotFoundException(`No tag matches ID ${req.params.id}.`)

    // pop/filter out tag ids from posts which already has this tag id
    const prev_posts = await Post.find({ tags: tag.id })
    prev_posts.map(async (prev_post) => {
      prev_post.tags = prev_post.tags.filter((prev_tag) => prev_tag !== tag.id)
      await Post.updateOne({ _id: prev_post.id }, { tags : prev_post.tags });
    })

    // push this tag id into posts which are in post_id array
    posts.map(async (post) => {
      if(!post.tags.includes(tag.id)){
        post.tags = [...post.tags, tag.id]
      }
      await Post.updateOne({ _id: post.id }, post);
    })

    // // PUT CHECKS FOR IF THE NEW OR OLD POST IS NOT FOUND
    // if(validatedData.post_id && !tag.post.includes(validatedData.post_id)){
    //   //DETACH FROM OLD POST
    //   let old_post = await Post.findOne({ tags: tag.id }).exec()
    //   if(old_post){
    //     // console.log('detach from old post before:', post);
    //     old_post.tags = old_post.tags.filter((found_tag) => {
    //       // console.log(found_tag, tag.id, found_tag !== tag.id, typeof(found_tag), typeof(tag.id));
    //       return found_tag !== tag.id
    //     })
    //     // console.log('detach from old post after:', post, post.tags);
    //     await old_post.save()
    //   }

    //   // ATTACH TO NEW POST
    //   // new_post = await Post.findOne({ _id: validatedData.post_id }).exec()
    //   // console.log('attach to new user before:', user);
    //   new_post.tags = [...new_post.tags, tag.id]
    //   // console.log('attach to new user after:', post);
    //   await new_post.save()
    // }

    if (validatedData?.text) tag.text = validatedData.text;
    // if (validatedData?.post_id) tag.post = [...tag.post, validatedData.post_id];
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