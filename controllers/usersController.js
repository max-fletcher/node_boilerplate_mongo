const { ZodError } = require('zod');
const User = require('../models/User');
var mongoose = require('mongoose');
const CustomException = require('../exceptions/CustomException');
const NotFoundException = require('../exceptions/NotFoundExceptions');

const getAllUsers = async (req, res) => {
  try{
    const users = await User.find();
    if (!users) return res.status(404).json({ 'message': 'No users found' });
    res.json(users);
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

const getAllUsersWithPosts = async (req, res) => {
  try{
    const users = await User.find().populate('posts');
      if (!users)
        return res.status(404).json({ 'message': 'No users found' });
    res.json(users);
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

const getUser = async (req, res) => {
  try {
    if (!req?.params?.id) return res.status(400).json({ message: 'User ID required' });
      if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({message:"Invalid user id!"});
      }
      const user = await User.findById((req.params.id)).exec();
      if (!user) {
        return res.status(404).json({ message: `User ${req.params.id} not found` });
      }
      res.json(user);
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

  // const user = await User.findOne({ _id: req.body.id }).exec();
  // console.log(user, !user, req.body.id);
  // if (!user) {
  //     console.log('HERE');
  //     return res.status(404).json({ message: `User ID ${req.body.id} not found` });
  // }
  // console.log(user, req.params.id, req.body.id);
  // res.json(user);
}

const deleteUser = async (req, res) => {
  try{
    if (!req?.params?.id) return res.status(400).json({ "message": 'User ID required' });
    const user = await User.findOne({ _id: req.params.id }).exec();
    if (!user) {
      return res.status(404).json({ 'message': `User ID ${req.params.id} not found` });
    }
    const result = await user.deleteOne({ _id: req.params.id });
    res.json(result);
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

module.exports = {
    getAllUsers,
    getAllUsersWithPosts,
    deleteUser,
    getUser
}