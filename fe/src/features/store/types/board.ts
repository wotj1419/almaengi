/** 게시판 타입 (ERD: boards.board_type) */
export type BoardType = 'NOTICE' | 'NORMAL';

/** 게시판 (ERD: boards) */
export interface Board {
  boardId: number;
  storeId: number;
  name: string;
  description: string | null;
  boardType: BoardType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 게시글 (ERD: posts) */
export interface Post {
  postId: number;
  boardId: number;
  writerId: number | null;
  title: string;
  content: string;
  viewCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  /** FE 전용: 조인된 작성자 정보 */
  writerName: string;
  writerPosition: string;
  /** FE 전용: 매장명 */
  storeName: string;
  /** FE 전용: 게시판 타입으로 카테고리 표시 */
  boardType: BoardType;
  /** FE 전용: 첨부 이미지 목록 */
  images: PostImage[];
  /** FE 전용: 확인한 유저 ID 목록 */
  checkedUserIds: number[];
  /** FE 전용: 확인 수 */
  checkCount: number;
}

/** 게시글 이미지 (ERD: post_images) */
export interface PostImage {
  imageId: number;
  postId: number;
  imageUrl: string;
  originName: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 게시글 댓글 (ERD: post_comments) */
export interface PostComment {
  commentId: number;
  postId: number;
  writerId: number | null;
  parentCommentId: number | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  /** FE 전용: 조인된 작성자 정보 */
  writerName: string;
  writerPosition: string;
}
