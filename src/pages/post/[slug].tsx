import { GetStaticPaths, GetStaticProps } from 'next';
import { FiUser, FiCalendar, FiClock  } from "react-icons/fi";
import Head from 'next/head'
import Image from 'next/image';
import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from "prismic-dom"
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {      
      body: {
        text: string;
      }[];
      heading: string;
    }[];
  };
}

interface PostProps {
  post: Post;
}

 export default function Post({post}:PostProps) {
  const router = useRouter()
  const readTime = calcReadTime()
  
  function calcReadTime(){
    if (!router.isFallback) {
      const postText = post.data.content.reduce( (acc, value)=>{
        let texto = RichText.asText(value.body)       
        return acc + texto
      },'').trim()
      
      const words = postText.split(/[ ]+/).length
      const minutes = words / 200
      return `${Math.ceil(minutes)} min`
    }
  }

  if (router.isFallback) {
    return <div>Carregando...</div>
  }else{
    return(
      <>
        <Head>{post.data.title} | spacetraveling</Head>
        <Header />
        <div className={styles.banner}>
        <Image 
          width={1440}
          height={400}
          src={post.data.banner.url} 
          objectFit="cover"
        />
        </div>
        <main className={commonStyles.homeContainer}>                                    
            <article className={styles.post}>
              <h1>{post.data.title}</h1>
              <div className={styles.postHeaderData}>
                  <span><FiCalendar />{format( parseISO(post.first_publication_date),'d MMM yyyy', {locale: ptBR})}</span>
                  <span><FiUser />{post.data.author}</span>
                  <span><FiClock />{readTime}</span>
              </div>
              {
                post.data.content.map( (content, key) => 
                  (
                    <div className={styles.postContent} key={key}>
                      <h2>{content.heading}</h2>
                      <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body)}} />
                    </div>
                  ))
              }              
                                       
            </article>
        </main>
      </>
    )
  }
 }

 export const getStaticPaths = async () => {
   const prismic = getPrismicClient();
   const preFetch = await prismic.query([
    Prismic.predicates.at('document.type','posts')
  ], {
    pageSize: 2
  })

  const paths = preFetch.results.map(conteudo => {
    return{
      params:{
        slug: conteudo.uid
      }
    }
  })

  return{
    paths: paths,
    fallback: true
  }

    
 };

 export const getStaticProps = async ({params}) => {
   const prismic = getPrismicClient();
   const {slug} = params
   const post = await prismic.getByUID('posts', String(slug), {}).then(function(response){
      return {
        uid: response.uid,
        first_publication_date: response.first_publication_date,
        data:{
          title : response.data.title,
          subtitle : response.data.subtitle,
          banner:{
            url: response.data.banner.url
          },    
          author: response.data.author,
          content: response.data.content
        }
      } 
    })
  

 

  return { 
    props: {
      post: post        
    }
  }   


 };
