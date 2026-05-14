export interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  date: string;
  categories: string[];
  content: string;
  thumbnail_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}
