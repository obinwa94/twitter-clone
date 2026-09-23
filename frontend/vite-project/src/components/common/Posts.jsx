import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { FaCircleQuestion } from "react-icons/fa6";

const Posts = ({ feedType }) => {

	const getPostEndpoint = () => {
		switch (feedType) {
			case "forYou":
				return "/api/posts/";

			case "following":
				return "/api/posts/following";

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
		queryKey: ["posts", feedType],

		queryFn: async () => {
			const res = await fetch(POST_ENDPOINT);

			const data = await res.json();

			if (!res.ok) {
				throw new Error(
					data.message || "Something went wrong"
				);
			}
			console.log("fetched data: ", data.data);
			
			return data.data;
		},
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

			{!isLoading && POSTS?.length === 0 && (
				<p className="text-center my-4">
					No posts in this tab. Switch 👻
				</p>
			)}

			{!isLoading && POSTS && (

				<div>
					{POSTS.map((post) => {
						return (

							<Post
								key={post._id}
								post={post}
							/>
						)
					})}
				</div>
			)}
		</>
	);
};

export default Posts;