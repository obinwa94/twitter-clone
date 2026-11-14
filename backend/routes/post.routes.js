const verifyToken = require('../middleware/verifyToken')
const {
    createPostController,
    likeUnlikeController,
    postCommentController,
    getAllController,
    getByIdController,
    deletePostController,
    getLikedPostController,
    getFollowingPostController,
    getUserPostController,
    repostController
} = require('../controllers/post.controllers')

const postRouter = require('express').Router()


postRouter.post('/create', verifyToken, createPostController)
postRouter.post('/like/:id', verifyToken, likeUnlikeController)
postRouter.get('/liked', verifyToken, getLikedPostController)
postRouter.get('/following', verifyToken, getFollowingPostController)
postRouter.get('/:username', verifyToken, getUserPostController)
postRouter.post('/comment/:id', verifyToken, postCommentController)
postRouter.get('/', verifyToken, getAllController)
postRouter.get('/:id', verifyToken, getByIdController)
postRouter.delete('/delete/:id', verifyToken, deletePostController)
postRouter.post('/repost/:id', verifyToken, repostController)

module.exports = postRouter;