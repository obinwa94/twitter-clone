import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
// import { POSTS } from "../../utils/db/dummy";
import { useQuery } from "@tanstack/react-query";

const Posts = () => {
	const { data: POSTS, isLoading, isError, error } = useQuery({
		queryKey: ["posts"],
		queryFn: async () => {
			const res = await fetch("/api/posts/")
			const data = await res.json()
			
			if (!res.ok) {
				throw new Error(data.message || "Something went wrong");

			}

			return data.data;
		}
	})


	if (isError) {
		return (
			<p className="text-center my-4 text-red-500">
				{error.message}
			</p>
		);
	}

	return (
		<>
			{isLoading && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}
			{!isLoading && POSTS?.length === 0 && <p className='text-center my-4'>No posts in this tab. Switch 👻</p>}
			{!isLoading && POSTS && (
				<div>
					{POSTS.map((post) => (
						<Post key={post._id} post={post} />
					))}
				</div>
			)}
		</>
	);
};
export default Posts;