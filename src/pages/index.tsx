import { useUser, SignInButton } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import { RouterOutputs, api } from "~/utils/api";
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";

dayjs.extend(relativeTime)

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState<string>("");

  const ctx = api.useUtils();

  const { mutate, isLoading: isPosting } = api.post.create.useMutation({
    onSuccess: () => {
      setInput("");
      ctx.post.getAll.invalidate() //makes the new post appears fast
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if(errorMessage && errorMessage[0]){
        toast.error(errorMessage[0])
      } else {
        toast.error("Failed to post! Please try again later");
      }
    }
  });

  if (!user) return null;

  return (
    <div className="flex gap-3 w-full">
      <Image 
        src={user.imageUrl} 
        alt="Profile image" 
        className="w-14 h-14 rounded-full"
        width={56}
        height={56}
      />
      <input 
        type="text" 
        placeholder="Type some emojis!" 
        className="bg-transparent grow outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if(e.key === "Enter") {
            e.preventDefault();
            if(input !== "") {
              mutate({ content: input })
            }
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting &&(
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}
      {isPosting && (
        <div className="flex justify-center items-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  )
}

type PostWithUser = RouterOutputs["post"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const { post, author } = props
  return (
    <div className="p-4 gap-3 border-b border-slate-400 flex" key={post.id}>
      <Image 
        src={author.profilePicture} 
        alt={`@${author.username}'s profile picture`} 
        className="w-14 h-14 rounded-full"
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300 gap-1">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` · ${dayjs(post.createdAt).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  )
}

const Feed = () => {
  const { data, isLoading: postsLoading } = api.post.getAll.useQuery();;

  if(postsLoading) return <LoadingPage />

  if(!data) return <div>Something went wrong</div>

  return (
    <div className="flex flex-col">
      {data?.map((fullpost) => (
        <PostView {...fullpost} key={fullpost.post.id} />
      ))}
    </div>
  )
}

export default function Home() {

  const { isLoaded: userLoaded, isSignedIn } = useUser();

  //start fetching asap
  api.post.getAll.useQuery();

  if(!userLoaded) return <div />

  return (
    <PageLayout>
      <div className="border-b border-slate-400 p-4">
        {!isSignedIn && <div className="flex justify-center"><SignInButton /></div>}
        {isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
}
