
import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";

const Posts = ({ feedType, userId, user }) => {

    const getPostEndpoint = () => {
        switch (feedType) {
            case "forYou":
                return "/api/posts/";

            case "following":
                return "/api/posts/following";

            case "posts":
                return `/api/posts/${encodeURIComponent(user.userName)}`;

            case "likes":
                return "/api/posts/liked";

            default:
                return "/api/posts/";
        }
    };

    const POST_ENDPOINT = getPostEndpoint();

    const {
        data: POSTS,
        isLoading,
        isError,
        error,
        isFetching,
    } = useQuery({
        queryKey: ["posts", feedType, userId, user?.userName],

        queryFn: async () => {
            const res = await fetch(POST_ENDPOINT);

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.message || "Something went wrong"
                );
            }

            return data.data;
        },

        enabled:
            feedType === "forYou" ||
            feedType === "following" ||
            (feedType === "posts" && Boolean(user?.userName)) ||
            (feedType === "likes" && Boolean(userId)),
    });

    if (isError) {
        return (
            <p className="text-center my-4 text-red-500">
                {error.message}
            </p>
        );
    }

    return (
        <>
            {(isLoading || isFetching) && (
                <div className="flex flex-col justify-center">
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                </div>
            )}

            {!isLoading && !isFetching && POSTS?.length === 0 && (
                <p className="text-center my-4">
                    No posts in this tab. Switch 👻
                </p>
            )}

            {!isLoading && !isFetching && POSTS && (
                <div>
                    {POSTS.map((post) => (
                        <Post
                            key={post._id}
                            post={post}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default Posts;
