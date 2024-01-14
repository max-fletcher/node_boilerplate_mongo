const User = require('../models/User');
var mongoose = require('mongoose');

const getAllUsers = async (req, res) => {
    const users = await User.find();
    if (!users) return res.status(204).json({ 'message': 'No users found' });
    res.json(users);
}

const getUser = async (req, res) => {
  try {
    if (!req?.params?.id) return res.status(400).json({ message: 'User ID required' });
      if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({message:"Invalid user id!"});
      }
      const user = await User.findById((req.params.id)).exec();
      if (!user) {
        return res.status(204).json({ message: `User ID ${req.params.id} not found` });
      }
      res.json(user);
  } catch (error) {
    res.sendStatus(400);
  }

  // const user = await User.findOne({ _id: req.body.id }).exec();
  // console.log(user, !user, req.body.id);
  // if (!user) {
  //     console.log('HERE');
  //     return res.status(204).json({ message: `User ID ${req.body.id} not found` });
  // }
  // console.log(user, req.params.id, req.body.id);
  // res.json(user);
}

const deleteUser = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ "message": 'User ID required' });
    const user = await User.findOne({ _id: req.params.id }).exec();
    if (!user) {
        return res.status(204).json({ 'message': `User ID ${req.params.id} not found` });
    }
    const result = await user.deleteOne({ _id: req.params.id });
    res.json(result);
}

module.exports = {
    getAllUsers,
    deleteUser,
    getUser
}