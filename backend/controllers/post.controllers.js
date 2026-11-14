const HTTPSTATUS = require("../config/http.config");
const Post = require("../models/post.model");
const User = require("../models/user.model");
const Notification = require('../models/notification.model');



async function createPostController(req, res) {
    const { text } = req.body
    let { img } = req.body
    const userId = req.user._id.toString()
    try {
        const user = await User.findById(userId)
        if (!user) return res.status(HTTPSTATUS.NOT_FOUND).json('User not found')
        if (!text && !img) {
            return res.status(HTTPSTATUS.BAD_REQUEST).json('Either text or image is required')
        }

        const newPost = new Post({
            text,
            img,
            user: userId
        })

        await newPost.save()
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: 'Post created',
            data: newPost
        })

    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}

// async function createPostController(req, res) {
//     const { text } = req.body;
//     let { img } = req.body;

//     const userId = req.user._id.toString();
  
//     try {
//         const user = await User.findById(userId);

//         if (!user) {
//             return res.status(HTTPSTATUS.NOT_FOUND).json({
//                 success: false,
//                 message: "User not found",
//             });
//         }

//         if (!text?.trim() && !img) {
//             return res.status(HTTPSTATUS.BAD_REQUEST).json({
//                 success: false,
//                 message: "Either text or image is required",
//             });
//         }

//         // Upload image to Cloudinary
//         if (img) {
//             const uploadResponse = await cloudinary.uploader.upload(img);

//             img = uploadResponse.secure_url;
//         }

//         // Create post with Cloudinary URL
//         const newPost = new Post({
//             text,
//             img,
//             user: userId,
//         });

//         await newPost.save();

//         return res.status(HTTPSTATUS.CREATED).json({
//             success: true,
//             message: "Post created",
//             data: newPost,
//         });
//     } catch (error) {
//         return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
//             success: false,
//             message: "Something went wrong 😥",
//             error: error.message,
//         });
//     }
// }

async function likeUnlikeController(req, res) {
    const postId = req.params.id

    const myId = req.user._id

    try {
        const post = await Post.findById(postId)

        if (!post) return res.status(HTTPSTATUS.NOT_FOUND).json('Post does not exit');

        //check if I already liked the post. If yes, unlike
        if (!post.likes.includes(myId)) {
            await Post.findByIdAndUpdate(postId, { $push: { likes: myId } })
            await User.findByIdAndUpdate(myId, { $push: { likedPosts: postId } })
            const notification = new Notification({
                from: myId,
                to: post.user,
                type: 'like'
            })
            await notification.save()
            res.status(HTTPSTATUS.OK).json('Post liked')
        } else {
            await Post.findByIdAndUpdate(postId, { $pull: { likes: myId } })
            await User.findByIdAndUpdate(myId, { $pull: { likedPosts: postId } })
            res.status(HTTPSTATUS.OK).json('Post unliked')
        }
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}
async function postCommentController(req, res) {
    const postId = req.params.id
    const myId = req.user._id
    const { text } = req.body

    try {
        const post = await Post.findById(postId)

        if (!post) return res.status(HTTPSTATUS.NOT_FOUND).json('Post does not exit');

        // const commented = await Post.findByIdAndUpdate(postId, { $push: { comments: { text: text, user: myId } } })
        post.comments.push({ text: text, user: myId })
        await post.save()
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: 'Comment posted',
            data: post
        })
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}

// async function deleteCommentController(req, res) {
//     const myId = req.user._id
//     const commentToDeleteId = req.params.id

//     try {
//         // find the post that contains this comment
//         const post = await Post.findOne({ 'comments._id': commentToDeleteId })
//         if (!post) return res.status(HTTPSTATUS.NOT_FOUND).json('Comment not found')

//         //find specific comment
//         const comment = post.comments.id(commentToDeleteId)
//         if (!comment) return res.status(HTTPSTATUS.NOT_FOUND).json('Comment not found')

//         // check if the logged-in user owns the comment
//         if (myId.toString() !== comment.user.toString()) return res.status(HTTPSTATUS.FORBIDDEN).json('Can only delete your comment')
//         await Post.findByIdAndDelete(post._id, {
//             $pull: {
//                 comments: {
//                     comment: commentToDeleteId
//                 }
//             }
//         }, { new: true })

//         return res.status(HTTPSTATUS.OK).json({
//             success: true,
//             message: 'Comment deleted successfully'
//         })


//     } catch (error) {
//         return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
//             success: false,
//             message: 'Something went wrong😥',
//             error: error.message
//         })
//     }
// }

async function getAllController(req, res) {
    try {
        const posts = await Post.find().sort({ createdAt: -1 })
            .populate({ path: 'user', select: '-password' })
            .populate({ path: 'comments.user', select: '-password' })
        if (!posts) return res.status(HTTPSTATUS.OK).json([])
        res.status(HTTPSTATUS.OK).json({
            success: true,
            Quantity: posts.length,
            message: 'Get method successful',
            data: posts
        })
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}


async function getByIdController(req, res) {
    const postId = req.params.id

    try {
        const post = await Post.findById(postId)
            .populate({ path: 'user', select: '-password' })
            .populate({ path: 'comments.user', select: '-password' })

        if (!post) return res.status(HTTPSTATUS.NOT_FOUND).json('Post not found')

        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: 'Get method successful',
            data: post
        })
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}

async function getLikedPostController(req, res) {
    try {
        const user = await User.findById(req.user._id)
        if (!user) return res.status(HTTPSTATUS.NOT_FOUND).json('User not found')
        const likedPosts = user.likedPosts
        if (!likedPosts) {
            res.status(HTTPSTATUS.OK).json({
                success: true,
                Quantity: likedPosts.length,
                message: 'Get method successful',
                data: []
            })
        }
        res.status(HTTPSTATUS.OK).json({
            success: true,
            Quantity: likedPosts.length,
            message: 'Get method successful',
            data: likedPosts
        })
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}
async function getFollowingPostController(req, res) {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(HTTPSTATUS.NOT_FOUND).json({
                success: false,
                message: "User not found",
            });
        }

        const followingPosts = await Post.find({
            user: { $in: user.followings },
        })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        return res.status(HTTPSTATUS.OK).json({
            success: true,
            quantity: followingPosts.length,
            message: "Get method successful",
            data: followingPosts,
        });

    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Something went wrong😥",
            error: error.message,
        });
    }
}
async function getUserPostController(req, res) {
    const username = req.params.username
    try {

        const user = await User.findOne({ userName: username })
        if (!user) return res.status(HTTPSTATUS.NOT_FOUND).json('User not found')
        const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 })
            .populate({ path: 'user', select: '-password' })
            .populate({ path: 'comments.user', select: '-password' })
        if (!posts) {
            res.status(HTTPSTATUS.OK).json({
                success: true,
                Quantity: posts.length,
                message: 'Get method successful',
                data: []
            })
        }
        res.status(HTTPSTATUS.OK).json({
            success: true,
            Quantity: posts.length,
            message: 'Get method successful',
            data: posts
        })
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}

async function deletePostController(req, res) {
    const myId = req.user._id
    const id = req.params.id
    try {
        const post = await Post.findById(id);

        if (!post) return res.status(HTTPSTATUS.NOT_FOUND).json('Post not found')
        // console.log(myId, post.user);
        if (myId.toString() !== post.user.toString()) return res.status(HTTPSTATUS.FORBIDDEN).json('Can only delete your own posts')

        await Post.findByIdAndDelete(id)
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: 'Post successfully deleted'
        })
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}
async function repostController(req, res) {
    const myId = req.user._id
    const postId = req.params.id
    try {
        const post = await Post.findById(postId);

        if (!post) return res.status(HTTPSTATUS.NOT_FOUND).json('Post not found')

        const alreadyReposted = post.reposts.includes(myId)

        if (!alreadyReposted) {
            post.reposts.push(myId)
            await post.save()
            await post.populate({path: "reposts.user", select: "-password"})
            res.status(HTTPSTATUS.OK).json({
                success: true,
                message: 'Reposted successfully',
                data: post
            })
        }
        if (alreadyReposted) {
            post.reposts = post.reposts.filter((id) => id.toString() !== myId.toString())
            await post.save()
            res.status(HTTPSTATUS.OK).json({
                success: true,
                message: 'Unreposted successfully'
            })
        }
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}


module.exports = {
    getAllController,
    createPostController,
    likeUnlikeController,
    postCommentController,
    deletePostController,
    getLikedPostController,
    getFollowingPostController,
    getUserPostController,
    repostController,
    getByIdController
}