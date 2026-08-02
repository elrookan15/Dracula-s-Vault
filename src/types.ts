export type ModelTag = 'GPT-4o' | 'Claude 3.5' | 'Gemini 2.5' | 'DeepSeek' | 'Local LLM';

export type PromptCategoryId =
  | 'writing'
  | 'code'
  | 'career'
  | 'finance'
  | 'agents'
  | 'data'
  | 'research'
  | 'creative'
  | 'marketing'
  | 'operations'
  | 'gaming';

export interface PromptCategory {
  id: PromptCategoryId;
  name: string;
  icon: string;
  accent: 'lime' | 'purple' | 'orange';
}

export interface PromptTemplate {
  id: string;
  title: string;
  categoryId: PromptCategoryId;
  model: ModelTag;
  description: string;
  framework: string;
  prompt: string;
  tags: string[];
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PromptFormValues = Pick<
  PromptTemplate,
  'title' | 'categoryId' | 'model' | 'description' | 'framework' | 'prompt' | 'tags'
>;

export interface LabBranch {
  id: string;
  name: string;
  values: Record<string, string>;
  createdAt: string;
}
