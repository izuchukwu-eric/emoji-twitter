import Head from "next/head";
import { api } from "~/utils/api";
import { GetStaticProps, NextPage } from "next/types";
import { PageLayout } from "~/components/layout";
import PostView from "~/components/postview";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
    const { data } = api.post.getPostById.useQuery({
      id
    })
    if(!data) return <div>404</div>

    return (
        <>
            <Head>
                <title>{`${data.post.content} - @${data.author.username}`}</title>
            </Head>
            <PageLayout>
              <PostView {...data} />
            </PageLayout>
        </>
    );
}

export default SinglePostPage;

export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();

    const id = context?.params?.id

    if(typeof id !== 'string') throw new Error("no id");

    await ssg.post.getPostById.prefetch({ id })

    return {
        props: {
            trpcState: ssg.dehydrate(),
            id
        }
    } 
}

export const getStaticPaths = () => {
    return { paths: [], fallback: "blocking" }
}