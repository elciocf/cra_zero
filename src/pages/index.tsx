import { GetStaticProps } from 'next';
import Head from 'next/head'
import Link from 'next/link'
import { FiUser, FiCalendar  } from "react-icons/fi";
import Prismic from '@prismicio/client'
import { getPrismicClient } from '../services/prismic';

import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

 export default function Home( {postsPagination} : HomeProps) {
    const [posts, setPosts] = useState<Post[]>(postsPagination.results)
    const [nextPage, setNextPage] = useState(postsPagination.next_page)

    function loadNextPage(){
       fetch(nextPage)
       .then(response => response.json())
       .then(list =>{          
          const postsList = list.results.map(post =>{            
            return {        
              uid: post.uid,
              first_publication_date: post.first_publication_date,
              data: { 
                  title : post.data.title,
                  subtitle: post.data.subtitle,
                  author: post.data.author
              }
                                                    
            }
          })          
          setNextPage(list.next_page)
          const newPostsList = [...postsList, ...posts]
          setPosts(newPostsList)
          
       })
    }

    return(
      <>
        <Head><title>Home | spacetraveling</title></Head>              
        <header className={styles.headerContainer}>
            <img src="/logo.svg" alt="logo" /> 
        </header>
        <main className={commonStyles.homeContainer}>                    
          <div className={styles.posts}>
            { posts.map(post =>(
              <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
               <strong>{post.data.title}</strong>
               <p>{post.data.subtitle}</p>                                           
               <div>
                 <span><FiCalendar />{format( parseISO(post.first_publication_date),'d MMM yyyy', {locale: ptBR})}</span>
                 <span><FiUser />{post.data.author}</span>
               </div>
             </a>
             </Link>
            ))}
          </div>
          {nextPage &&
            <div className={styles.nextButtonContainer}>
            <button type="button" onClick={()=> loadNextPage() } >Carregar mais posts</button>
            </div>     
          }
          
        </main>
      </>
    )
 }

 export const getStaticProps = async () => {
    const prismic = getPrismicClient();
    const postsResponse = await prismic.query([
      Prismic.predicates.at('document.type','posts')
    ], {
      fetch: ['post.title', 'post.content'],
      pageSize: 2,
    })

    
    const posts = postsResponse.results.map(post =>{
      return {        
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data:{
          title : post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }        
      }
    })
    
    

    return { 
      props: {
        postsPagination:{
          next_page: postsResponse.next_page,
          results: posts
        }
      }
    } 

};
  

