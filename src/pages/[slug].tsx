import Head from "next/head";
import Image from "next/image"
import { api } from "~/utils/api";
import { GetStaticProps, NextPage } from "next/types";

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
    const { data } = api.profile.getUserByUsername.useQuery({
        username
    })
    if(!data) return <div>404</div>

    return (
        <>
            <Head>
                <title>{data.username}</title>
            </Head>
            <PageLayout>
                <div className="h-36 relative border-b border-slate-400 bg-slate-600">
                    <Image 
                        src={data?.profilePicture} 
                        alt={`${data?.username}'s profile pic`} 
                        width={128}
                        height={128}
                        className="-mb-[64px] absolute bottom-0 left-0 ml-4 rounded-full border-4 border-black bg-black"
                    />
                </div>
                <div className="h-[64px]"></div>
                <div className="p-4 text-2xl font-bold">{`@${data?.username}`}</div>
                <div className="border-b border-slate-400 w-full"></div>
            </PageLayout>
        </>
    );
}

export default ProfilePage;

import { createServerSideHelpers } from '@trpc/react-query/server';
import { db } from "~/server/db"
import superjson from "superjson"
import { appRouter } from "~/server/api/root";
import { PageLayout } from "~/components/layout";

export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = createServerSideHelpers({
        router: appRouter,
        ctx: { db, userId: null },
        transformer: superjson, // optional - adds superjson serialization
     })

    const slug = context?.params?.slug

    if(typeof slug !== 'string') throw new Error("no slug");

    const username = slug.replace("@", "");

    await ssg.profile.getUserByUsername.prefetch({ username })

    return {
        props: {
            trpcState: ssg.dehydrate(),
            username
        }
    } 
}

export const getStaticPaths = () => {
    return { paths: [], fallback: "blocking" }
}