import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import { IoSettingsOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { FaHeart } from "react-icons/fa6";

const NotificationPage = () => {
	// const isLoading = false;

	const queryClient = useQueryClient();
	const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await fetch("/api/notifications", {
				method: "GET",
				credentials: "include"
			});
			const data = await res.json()
			if (!res.ok) {
				throw new Error(data.message || "Something went wrong");
			}
			return data;
		}
	});

	const {mutate: deleteAllNotifications, isPending: isDeletingNotifications} = useMutation({
		mutationFn: async () => {
			try {
				const res = await fetch("/api/notifications/delete", {
				method: "DELETE",
				credentials: "include"
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.message || "Something went wrong");
			}
			return data;
			} catch (error) {
				throw new Error("Failed to delete notifications");
			}
		},
		onSuccess: () => {
			// Invalidate the notifications query to refetch the data
			toast.success("All notifications deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete notifications");
		}
	});

	const handDeleteNotifications = (e) => {
		e.preventDefault();
		deleteAllNotifications();
	};

	return (
		<div className="flex-[4_4_0] border-l border-r border-gray-700 min-h-screen" >
			<div className="flex justify-between items-center p-4 border-b border-gray-700">
				<p className="font-bold">Notifications</p>

				<div className="dropdown">
					<div tabIndex={0} role="button" className="m-1">
						<IoSettingsOutline className="w-4" />
					</div>

					<ul
						tabIndex={0}
						className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
					>
						<li>
							<button onClick={handDeleteNotifications}>
								{isDeletingNotifications? "Deleting..." : "Delete all notifications"}
							</button>
						</li>
					</ul>
				</div>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center h-40">
					<LoadingSpinner size="lg" />
				</div>
			) : notifications.length === 0 ? (
				<div className="text-center p-4 font-bold">
					No notifications 🤔
				</div>
			) : (
				notifications.map((notification) => (
					<div
						className="border-b border-gray-700"
						key={notification._id}
					>
						<Link
							to={`/profile/${notification.from.userName}`}
							className="flex gap-3 p-4 hover:bg-base-200 transition-colors"
						>
							{notification.type === "follow" && (
								<FaUser className="w-7 h-7 text-primary shrink-0" />
							)}

							{notification.type === "like" && (
								<FaHeart className="w-7 h-7 text-red-500 shrink-0" />
							)}

							<div className="flex items-center gap-2">
								<div className="avatar">
									<div className="w-8 rounded-full">
										<img
											src={
												notification.from.profileImg ||
												"/avatar-placeholder.png"
											}
											alt={notification.from.userName}
										/>
									</div>
								</div>

								<div className="flex flex-wrap gap-1">
									<span className="font-bold">
										@{notification.from.userName}
									</span>

									<span>
										{notification.type === "follow"
											? "followed you"
											: notification.type === "like"
												? "liked your post"
												: "interacted with you"}
									</span>
								</div>
							</div>
						</Link>
					</div>
				))
			)}
		</div >
	);
};

export default NotificationPage;
