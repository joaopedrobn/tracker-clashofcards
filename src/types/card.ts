export type CardCategory =
  | "elixir"
  | "dark-elixir"
  | "builder-base"
  | "super-troops";

export interface Card {
  id: string;
  nameKey: string;
  category: CardCategory;
  image: string;
  order: number;
}

export interface Category {
  id: CardCategory;
  nameKey: string;
  shortNameKey: string;
  descriptionKey: string;
  accent: string;
}
