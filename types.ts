
export interface CardItem {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
  excluded: boolean;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  items: CardItem[];
  createdAt: number;
  password?: string;
}

export type ViewState = 'dashboard' | 'editor' | 'shuffler';