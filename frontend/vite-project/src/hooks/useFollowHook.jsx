import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useFollowHook = () => {

    const queryClient = useQueryClient();

    const { mutate: follow, isPending } = useMutation({
        mutationFn: async (userId) => {
            try {
                const res = await fetch(`/api/users/follow/${userId}`, {
                    method: "POST"
                })
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data.message || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: (data) => {
            const message = data?.message.toLowerCase() || "";
            if (message.includes("unfollow")) {
                toast.success("Unfollowed successfully");
            } else {
                toast.success("Followed successfully");
            }

            Promise.all([
                queryClient.invalidateQueries({ queryKey: ["suggested"] }),
                queryClient.invalidateQueries({ queryKey: ["authUser"] })
            ])
        },
        onError: (error) => {
            toast.error(error.message || "Something went wrong");
        }

    })

    return { follow, isPending }
}

export default useFollowHook;