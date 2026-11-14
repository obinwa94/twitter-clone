
import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import useFollowHook from "../../hooks/useFollowHook";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";

import { FaArrowLeft, FaLink } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import toast from "react-hot-toast";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const ProfilePage = () => {
    const { follow, isPending } = useFollowHook();
    const { username } = useParams();
    const [coverImg, setCoverImg] = useState(null);
    const [profileImg, setProfileImg] = useState(null);
    const [feedType, setFeedType] = useState("posts");
    const [imageError, setImageError] = useState("");

    
    const coverImgRef = useRef(null);
    const profileImgRef = useRef(null);

    const queryClient = useQueryClient();

    // Fetch the authenticated user.
    const {
        data: authUser,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me");
            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.message || "Could not fetch user."
                );
            }

            return data;
        },
    });

    const { mutate: updateProfileMutation, isPending: isUpdatingProfile } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch("/api/users/update", {
                    method: "PUT",
                    headers: {
                        "Content-type": "application/json"
                    },
                    body: JSON.stringify({ profileImg, coverImg })
                })
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Failed to update profile images.");
                }
                return data;
            } catch (error) {
                throw new Error("Failed to update profile images.");
            }
        },
        onSuccess: () => {
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ["authUser"] }),
                queryClient.invalidateQueries({ queryKey: ["profileUser"] })
            ])
            setCoverImg(null);
            setProfileImg(null);
            setImageError("");
            toast.success("Profile images updated successfully.");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update profile images.");
        }
    });

    
    // Fetch the profile belonging to the username in the URL.
    const {
        data: profileUser,
        isLoading: isProfileLoading,
        isError: isProfileError,
        error: profileError,
    } = useQuery({
        queryKey: ["profileUser", username],
        queryFn: async () => {
            const res = await fetch(
                `/api/users/profile/${encodeURIComponent(username)}`
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Could not fetch profile.");
            }

            return data.user ?? data;
        },
        enabled: Boolean(username),
    });

    const user = profileUser ?? null;

    // Compare IDs instead of hardcoding profile ownership.
    const isMyProfile = Boolean(
        authUser?._id &&
        user?._id &&
        authUser._id === user._id
    );

    const iAmFollowing = authUser?.followings?.includes(user?._id);


    // Validate and preview the selected image.
    const handleImgChange = (e, imageType) => {
        const file = e.target.files?.[0];

        // Allow selecting the same file 0again later.
        e.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setImageError("Please select a valid image file.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setImageError("Image size must not exceed 5 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                setImageError("Could not preview the selected image.");
                return;
            }

            if (imageType === "coverImg") {
                setCoverImg(reader.result);
            } else if (imageType === "profileImg") {
                setProfileImg(reader.result);
            }

            setImageError("");
        };

        reader.onerror = () => {
            setImageError("Failed to read the selected image.");
        };

        reader.readAsDataURL(file);
    };

    // Persist image changes through the backend.
    // const updateProfileMutation = useMutation({
    //     mutationFn: async () => {
    //         const updates = {};

    //         if (coverImg) updates.coverImg = coverImg;
    //         if (profileImg) updates.profileImg = profileImg;

    //         const res = await fetch("/api/users/update", {
    //             method: "PUT",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             credentials: "include",
    //             body: JSON.stringify(updates),
    //         });

    //         const data = await res.json();

    //         if (!res.ok) {
    //             throw new Error(
    //                 data.message || "Failed to update profile images."
    //             );
    //         }

    //         return data;
    //     },

    //     onSuccess: (data) => {
    //         // Update cached user data with the server response.
    //         queryClient.setQueryData(["authUser"], (oldUser) => ({
    //             ...oldUser,
    //             ...(data.user ?? data),
    //         }));

    //         queryClient.invalidateQueries({
    //             queryKey: ["authUser"],
    //         });

    //         setCoverImg(null);
    //         setProfileImg(null);
    //         setImageError("");
    //     },
    // });

    const handleImageUpdate = () => {
        if (!coverImg && !profileImg) return;

        setImageError("");
        updateProfileMutation();
    };

    // Normalize a profile link before using it as an href.
    const getSafeProfileLink = (link) => {
        if (!link || typeof link !== "string") return null;

        try {
            const normalizedLink = /^https?:\/\//i.test(link)
                ? link
                : `https://${link}`;

            const url = new URL(normalizedLink);

            if (!["http:", "https:"].includes(url.protocol)) {
                return null;
            }

            return url.href;
        } catch {
            return null;
        }
    };

    const profileLink = getSafeProfileLink(user?.link);

    const joinedDate = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        })
        : null;

    const postCount =
        typeof user?.postsCount === "number"
            ? user.postsCount
            : Array.isArray(user?.posts)
                ? user.posts.length
                : null;

    if (isLoading || isProfileLoading) {
        return <ProfileHeaderSkeleton />;
    }

    if (isProfileError) {
        return (
            <div className="text-center p-4">
                <p className="text-error">
                    {profileError?.message || "Failed to load profile."}
                </p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex-[4_4_0] min-h-screen border-r border-gray-700 p-4">
                <p className="text-center text-lg text-error">
                    {error?.message || "Failed to load profile."}
                </p>
                <button
                    type="button"
                    className="btn btn-outline mt-4"
                    onClick={() =>
                        queryClient.invalidateQueries({
                            queryKey: ["authUser"],
                        })
                    }
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-[4_4_0] min-h-screen border-r border-gray-700">
                <p className="text-center text-lg mt-4">
                    User not found.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-[4_4_0] border-r border-gray-700 min-h-screen">
            {/* Header */}
            <div className="flex flex-col">
                <div className="flex gap-10 px-4 py-2 items-center">
                    <Link to="/" aria-label="Go back home">
                        <FaArrowLeft className="w-4 h-4" />
                    </Link>

                    <div className="flex flex-col">
                        <p className="font-bold text-lg">
                            {user.fullName}
                        </p>
                        <span className="text-sm text-slate-500">
                            {postCount !== null
                                ? `${postCount} posts`
                                : "Profile"}
                        </span>
                    </div>
                </div>

                {/* Cover image */}
                <div className="relative group/cover">
                    <img
                        src={
                            coverImg ||
                            user.coverImg ||
                            "/cover.png"
                        }
                        className="h-52 w-full object-cover"
                        alt={`${user.fullName || "User"}'s cover`}
                    />

                    {isMyProfile && (
                        <button
                            type="button"
                            aria-label="Change cover image"
                            className="absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 focus:opacity-100 transition duration-200"
                            onClick={() =>
                                coverImgRef.current?.click()
                            }
                        >
                            <MdEdit className="w-5 h-5 text-white" />
                        </button>
                    )}

                    <input
                        ref={coverImgRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                            handleImgChange(e, "coverImg")
                        }
                    />

                    <input
                        ref={profileImgRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                            handleImgChange(e, "profileImg")
                        }
                    />

                    {/* Profile avatar */}
                    <div className="avatar absolute -bottom-16 left-4">
                        <div className="w-32 rounded-full relative group/avatar">
                            <img
                                src={
                                    profileImg ||
                                    user.profileImg ||
                                    "/avatar-placeholder.png"
                                }
                                alt={`${user.fullName || "User"}'s profile`}
                                className="w-32 h-32 rounded-full object-cover"
                            />

                            {isMyProfile && (
                                <button
                                    type="button"
                                    aria-label="Change profile picture"
                                    className="absolute top-5 right-3 p-1 bg-primary rounded-full opacity-0 group-hover/avatar:opacity-100 focus:opacity-100 cursor-pointer transition"
                                    onClick={() =>
                                        profileImgRef.current?.click()
                                    }
                                >
                                    <MdEdit className="w-4 h-4 text-white" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile actions */}
                <div className="flex justify-end items-center gap-2 px-4 mt-5">
                    {isMyProfile && <EditProfileModal authUser={authUser} />}

                    {!isMyProfile && (
                        <button
                            type="button"
                            className="btn btn-outline rounded-full btn-sm"
                            onClick={() =>
                                follow(user._id)
                            }
                        >
                            {isPending && "Processing..."}
                            {!isPending && iAmFollowing && "Unfollow"}
                            {!isPending && !iAmFollowing && "Follow"}
                        </button>
                    )}

                    {(coverImg || profileImg) && isMyProfile && (
                        <button
                            type="button"
                            className="btn btn-primary rounded-full btn-sm text-white px-4"
                            onClick={handleImageUpdate}
                            disabled={isUpdatingProfile}
                        >
                            {isUpdatingProfile
                                ? "Updating..."
                                : "Update"}
                        </button>
                    )}
                </div>

                {/* Image validation and save errors */}
                {(imageError || updateProfileMutation.isError) && (
                    <p className="text-error text-sm px-4 mt-2" role="alert">
                        {imageError ||
                            updateProfileMutation.error?.message}
                    </p>
                )}

                {updateProfileMutation.isSuccess && (
                    <p className="text-success text-sm px-4 mt-2" role="status">
                        Profile images updated successfully.
                    </p>
                )}

                {/* User information */}
                <div className="flex flex-col gap-4 mt-14 px-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-lg">
                            {user.fullName}
                        </span>

                        <span className="text-sm text-slate-500">
                            @{user.userName}
                        </span>

                        {user.bio && (
                            <span className="text-sm my-1">
                                {user.bio}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        {profileLink && (
                            <div className="flex gap-1 items-center">
                                <FaLink className="w-3 h-3 text-slate-500" />
                                <a
                                    href={profileLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-500 hover:underline break-all"
                                >
                                    {user.link}
                                </a>
                            </div>
                        )}

                        {joinedDate && (
                            <div className="flex gap-2 items-center">
                                <IoCalendarOutline className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-500">
                                    Joined {joinedDate}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Followers and following */}
                    <div className="flex gap-4">
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-xs">
                                {user.following?.length ?? 0}
                            </span>
                            <span className="text-slate-500 text-xs">
                                Following
                            </span>
                        </div>

                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-xs">
                                {user.followers?.length ?? 0}
                            </span>
                            <span className="text-slate-500 text-xs">
                                Followers
                            </span>
                        </div>
                    </div>
                </div>

                {/* Posts and likes tabs */}
                <div className="flex w-full border-b border-gray-700 mt-4">
                    <button
                        type="button"
                        className={`flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 relative ${feedType === "posts"
                            ? ""
                            : "text-slate-500"
                            }`}
                        aria-pressed={feedType === "posts"}
                        onClick={() => setFeedType("posts")}
                    >
                        Posts
                        {feedType === "posts" && (
                            <span className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                        )}
                    </button>

                    <button
                        type="button"
                        className={`flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 relative ${feedType === "likes"
                            ? ""
                            : "text-slate-500"
                            }`}
                        aria-pressed={feedType === "likes"}
                        onClick={() => setFeedType("likes")}
                    >
                        Likes
                        {feedType === "likes" && (
                            <span className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                        )}
                    </button>
                </div>

                {/* Posts must support these props to filter correctly. */}
                <Posts
                    feedType={feedType}
                    userId={user._id}
                    user={user}
                />
            </div>
        </div>
    );
};

export default ProfilePage;