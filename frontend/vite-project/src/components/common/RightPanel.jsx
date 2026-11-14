
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import useFollowHook from "../../hooks/useFollowHook";

import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";
import LoadingSpinner from "../common/LoadingSpinner";

const RightPanel = () => {
	const { follow, isPending } = useFollowHook();

	const {
		data: suggestedUsers,
		isLoading,
		isError,
		error
	} = useQuery({
		queryKey: ["suggested"],
		queryFn: async () => {
			const res = await fetch('/api/users/suggested');

			const data = await res.json();

			if (!res.ok) {
				throw new Error(
					data.message || "Something went wrong"
				);
			}

			return data;
		}
	});

	if (!isLoading && suggestedUsers?.length === 0) {
		return <div className='md:w-64 w-0'></div>;
	}

	return (
		<div className='hidden lg:block my-4 mx-2'>
			<div className='bg-[#16181C] p-4 rounded-md sticky top-2'>
				<p className='font-bold pb-4'>Who to follow</p>

				<div className='flex flex-col gap-4'>

					{isLoading && (
						<>
							<RightPanelSkeleton />
							<RightPanelSkeleton />
							<RightPanelSkeleton />
							<RightPanelSkeleton />
						</>
					)}

					{isError && (
						<p className='text-sm text-red-500'>
							{error.message}
						</p>
					)}

					{!isLoading && !isError &&
						suggestedUsers?.map((user) => (
							<div
								className='flex items-center justify-between gap-4'
								key={user._id}
							>
								<Link
									to={`/profile/${user.userName}`}
									className='flex gap-2 items-center'
								>
									<div className='avatar'>
										<div className='w-8 rounded-full'>
											<img
												src={
													user.profileImg ||
													"/avatar-placeholder.png"
												}
												alt={user.fullName}
											/>
										</div>
									</div>

									<div className='flex flex-col'>
										<span className='font-semibold tracking-tight truncate w-28'>
											{user.fullName}
										</span>

										<span className='text-sm text-slate-500'>
											@{user.userName}
										</span>
									</div>
								</Link>

								<button
									className='btn bg-white text-black hover:bg-white hover:opacity-90 rounded-full btn-sm'
									onClick={() => follow(user._id)}
									disabled={isPending}
								>
									{isPending
										? <LoadingSpinner size='sm' />
										: "Follow"}
								</button>
							</div>
						))
					}

				</div>
			</div>
		</div>
	);
};

export default RightPanel;
