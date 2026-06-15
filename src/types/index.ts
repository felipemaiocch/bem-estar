import type { JWTPayload } from "jose";
import type { LucideIcon } from "lucide-react";

export type UserRole = "USER" | "PROFESSIONAL" | "ADMIN";

export interface SessionPayload extends JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AppNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface EngagementCard {
  title: string;
  description: string;
  metric: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
}

export type EngagementCategorySlug =
  | "saude-bem-estar"
  | "cultura"
  | "agenda-dr";

export interface EngagementCategoryItem {
  title: string;
  date: string;
  location: string;
  status: string;
  points: number;
  gradient: string;
}

export interface EngagementCategoryFeature {
  title: string;
  description: string;
}

export interface EngagementCategoryPage {
  slug: EngagementCategorySlug;
  icon: LucideIcon;
  eyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroGradient: string;
  featureList: string[];
  sectionEyebrow: string;
  sectionTitle: string;
  sectionDescription: string;
  cards: EngagementCategoryItem[];
  feedTitle: string;
  feedDescription: string;
  feedItems: EngagementCategoryFeature[];
  interactionTitle: string;
  interactionDescription: string;
  comments: string[];
  primaryAction: string;
  secondaryAction: string;
}

export interface FeedComment {
  id: string;
  author: string;
  text: string;
}

export interface ActivityFeedPost {
  id: string;
  professional: string;
  professionalRole: string;
  activity: string;
  time: string;
  location: string;
  image: string;
  caption: string;
  likes: number;
  likedByUser: boolean;
  comments: FeedComment[];
}

export interface Testimonial {
  id: string;
  collaborator: string;
  area: string;
  professional: string;
  activity: string;
  rating: number;
  quote: string;
  impact: string;
}

export interface Slot {
  time: string;
  specialist: string;
  specialty: string;
  status: "available" | "occupied" | "waitlist";
}

export interface NotificationPreference {
  label: string;
  description: string;
  enabled: boolean;
}

export type CareRecordCategory =
  | "psicologia"
  | "fisioterapia"
  | "nutricao"
  | "enfermagem"
  | "geral";

export interface CareRecordMetric {
  label: string;
  value: string;
}

export type CareRecordSourceType =
  | "manual"
  | "appointment"
  | "event"
  | "ead"
  | "checkin"
  | "library";

export type CareRecordVisibility =
  | "user_visible"
  | "team_only"
  | "admin_only"
  | "family_visible";

export type CareRecordPriority = "low" | "normal" | "attention" | "critical";

export type CareRecordFollowUpStatus = "open" | "in_progress" | "resolved";

export interface MonitoredUser {
  id: string;
  name: string;
  email: string;
  area: string;
  objective: string;
}

export interface CareRecordCategoryOption {
  value: CareRecordCategory;
  label: string;
  professionalRole: string;
  professionals: string[];
  accent: string;
  defaultTitle: string;
  defaultSummary: string;
  defaultDelivery: string;
  defaultNextStep: string;
  metricSuggestions: string[];
}

export interface UserCareRecord {
  id: string;
  userId: string;
  userName: string;
  userArea: string;
  category: CareRecordCategory;
  sourceType: CareRecordSourceType;
  sourceId: string | null;
  visibility: CareRecordVisibility;
  priority: CareRecordPriority;
  requiresFollowUp: boolean;
  followUpStatus: CareRecordFollowUpStatus;
  professional: string;
  professionalRole: string;
  title: string;
  summary: string;
  delivery: string;
  nextStep: string;
  metrics: CareRecordMetric[];
  recordedAtIso: string;
  recordedAtLabel: string;
}
