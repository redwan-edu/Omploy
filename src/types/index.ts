export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  is_active: boolean;
  capabilities: string[];
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  duration: number;
  summary: string;
}

export interface NavLink {
  path: string;
  label: string;
  icon: string;
}

export interface Integration {
  id: string;
  name: string;
  is_connected: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  voice_url?: string;
  created_at: string;
}

export interface Plan {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  period: string;
  services: string[];
  cta_text: string;
  popular: boolean;
}
