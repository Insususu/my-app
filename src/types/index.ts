export interface Post {
  id: string;
  title: string;
  author: string;
  date: string;
  hits: number;
  likes: number;
  comments: number;
}

export interface PostDetail extends Post {
  content: string[];
  topComments: Comment[];
}

export interface Comment {
  author: string;
  text: string;
  likes: number;
}

export type PanelType = 'title' | 'narration' | 'dialogue' | 'comment';

export interface WebtoonPanel {
  text: string;
  type: PanelType;
  speaker?: string;
}
