export type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: "active" | "archived";
  visibility: "public" | "private";
  created_at: string;
};

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  priority: "low" | "medium" | "high";
  due_date?: string | null;
  assignee?: string | null;
  status: string;
  order_index: number;
  created_at: string;
};