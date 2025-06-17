import { supabase } from './supabase';
import { Post } from '../types';

export interface CreatePostData {
  title: string;
  caption: string;
  mediaUrl: string;
  mediaType?: string;
}

export async function createPost(postData: CreatePostData): Promise<Post | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user profile for post metadata
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, profile_photo_url')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error('Failed to get user profile');
    }

    // Insert post into database
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: postData.title,
        caption: postData.caption,
        media_url: postData.mediaUrl,
        media_type: postData.mediaType || 'image'
      })
      .select()
      .single();

    if (postError) {
      throw postError;
    }

    // Transform to Post type
    const transformedPost: Post = {
      id: newPost.id,
      userId: newPost.user_id,
      userName: profile?.name || 'Unknown User',
      userDpUrl: profile?.profile_photo_url || `https://i.pravatar.cc/300?img=${user.id}`,
      title: newPost.title,
      mediaUrl: newPost.media_url,
      caption: newPost.caption,
      timestamp: newPost.created_at
    };

    return transformedPost;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          name,
          profile_photo_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform to Post type
    const transformedPosts: Post[] = (posts || []).map(post => ({
      id: post.id,
      userId: post.user_id,
      userName: post.profiles?.name || 'Unknown User',
      userDpUrl: post.profiles?.profile_photo_url || `https://i.pravatar.cc/300?img=${post.user_id}`,
      title: post.title,
      mediaUrl: post.media_url,
      caption: post.caption,
      timestamp: post.created_at
    }));

    return transformedPosts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
}

export async function getAllPosts(limit: number = 50): Promise<Post[]> {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          name,
          profile_photo_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Transform to Post type
    const transformedPosts: Post[] = (posts || []).map(post => ({
      id: post.id,
      userId: post.user_id,
      userName: post.profiles?.name || 'Unknown User',
      userDpUrl: post.profiles?.profile_photo_url || `https://i.pravatar.cc/300?img=${post.user_id}`,
      title: post.title,
      mediaUrl: post.media_url,
      caption: post.caption,
      timestamp: post.created_at
    }));

    return transformedPosts;
  } catch (error) {
    console.error('Error getting all posts:', error);
    return [];
  }
}