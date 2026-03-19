import { create } from 'zustand';
import type { Board, Post, PostComment } from '@/features/store/types/board';
import {
  mockBoards,
  mockPosts,
  mockPostComments,
} from '@/features/store/data/mockBoard';

interface BoardStore {
  boards: Board[];
  posts: Post[];
  comments: Record<number, PostComment[]>;
  nextPostId: number;
  nextCommentId: number;
  addPost: (
    post: Omit<
      Post,
      | 'postId'
      | 'viewCount'
      | 'isDeleted'
      | 'checkCount'
      | 'checkedUserIds'
      | 'createdAt'
      | 'updatedAt'
    >
  ) => number;
  addComment: (
    postId: number,
    comment: Omit<
      PostComment,
      'commentId' | 'isDeleted' | 'createdAt' | 'updatedAt'
    >
  ) => void;
  toggleCheck: (postId: number, userId: number) => void;
}

export const useBoardStore = create<BoardStore>()((set, get) => ({
  boards: mockBoards,
  posts: mockPosts,
  comments: mockPostComments,
  nextPostId: 100,
  nextCommentId: 100,

  addPost: (postData) => {
    const state = get();
    const newPostId = state.nextPostId;
    const now = new Date().toISOString();
    const newPost: Post = {
      ...postData,
      postId: newPostId,
      viewCount: 0,
      isDeleted: false,
      checkedUserIds: [],
      checkCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({
      posts: [newPost, ...s.posts],
      nextPostId: s.nextPostId + 1,
    }));
    return newPostId;
  },

  addComment: (postId, commentData) => {
    const state = get();
    const now = new Date().toISOString();
    const newComment: PostComment = {
      ...commentData,
      commentId: state.nextCommentId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({
      comments: {
        ...s.comments,
        [postId]: [...(s.comments[postId] ?? []), newComment],
      },
      nextCommentId: s.nextCommentId + 1,
    }));
  },

  toggleCheck: (postId, userId) => {
    set((s) => ({
      posts: s.posts.map((p) => {
        if (p.postId !== postId) return p;
        const alreadyChecked = p.checkedUserIds.includes(userId);
        const newCheckedUserIds = alreadyChecked
          ? p.checkedUserIds.filter((id) => id !== userId)
          : [...p.checkedUserIds, userId];
        return {
          ...p,
          checkedUserIds: newCheckedUserIds,
          checkCount: newCheckedUserIds.length,
        };
      }),
    }));
  },
}));
