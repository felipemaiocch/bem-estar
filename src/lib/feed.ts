import type { ContentStatus } from "@prisma/client";

import { activityFeedPosts } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/runtime-mode";

export interface FeedCommentView {
  id: string;
  author: string;
  text: string;
}

export interface FeedPostView {
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
  comments: FeedCommentView[];
}

export interface ListFeedPostsOptions {
  limit?: number;
  offset?: number;
}

export interface FeedPostsPage {
  posts: FeedPostView[];
  hasMore: boolean;
  nextOffset: number | null;
}

interface CreateFeedPostInput {
  authorId: string;
  professionalRole: string;
  activity: string;
  location?: string;
  imageUrl?: string;
  caption: string;
  status?: ContentStatus;
}

type DemoFeedComment = {
  id: string;
  author: string;
  authorId: string;
  text: string;
};

type DemoFeedPost = {
  id: string;
  professional: string;
  professionalRole: string;
  activity: string;
  location: string;
  image: string;
  caption: string;
  createdAtIso: string;
  likedUserIds: string[];
  comments: DemoFeedComment[];
};

declare global {
  var semonitoraDemoFeedPosts: DemoFeedPost[] | undefined;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1400&q=80";
const defaultFeedPageLimit = 6;
const maxFeedPageLimit = 20;

function formatWhen(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(value)
    .replace(".", "");
}

function normalizeText(value: string) {
  return value.trim();
}

function getDisplayNameByUserId(userId: string) {
  if (userId === "user-felipe") {
    return "Felipe";
  }

  if (userId === "professional-camila") {
    return "Camila Rocha";
  }

  if (userId === "admin-paula") {
    return "Paula Admin";
  }

  if (userId.startsWith("user-larissa")) {
    return "Larissa";
  }

  if (userId.startsWith("user-amanda")) {
    return "Amanda";
  }

  return "Equipe";
}

function getDemoStore() {
  if (!global.semonitoraDemoFeedPosts) {
    global.semonitoraDemoFeedPosts = activityFeedPosts.map((post, index) => {
      const createdAt = new Date();
      createdAt.setHours(createdAt.getHours() - index * 4);

      return {
        id: post.id,
        professional: post.professional,
        professionalRole: post.professionalRole,
        activity: post.activity,
        location: post.location,
        image: post.image,
        caption: post.caption,
        createdAtIso: createdAt.toISOString(),
        likedUserIds: post.likedByUser ? ["user-felipe"] : [],
        comments: post.comments.map((comment) => ({
          id: comment.id,
          author: comment.author,
          authorId: comment.author.toLowerCase(),
          text: comment.text,
        })),
      };
    });
  }

  return global.semonitoraDemoFeedPosts;
}

function mapDemoToView(post: DemoFeedPost, userId: string): FeedPostView {
  return {
    id: post.id,
    professional: post.professional,
    professionalRole: post.professionalRole,
    activity: post.activity,
    time: formatWhen(new Date(post.createdAtIso)),
    location: post.location,
    image: post.image,
    caption: post.caption,
    likes: post.likedUserIds.length,
    likedByUser: post.likedUserIds.includes(userId),
    comments: post.comments.map((comment) => ({
      id: comment.id,
      author: comment.author,
      text: comment.text,
    })),
  };
}

function resolveFeedOptions(options?: ListFeedPostsOptions) {
  const limit = Math.min(
    maxFeedPageLimit,
    Math.max(1, Math.trunc(options?.limit ?? defaultFeedPageLimit)),
  );
  const offset = Math.max(0, Math.trunc(options?.offset ?? 0));

  return { limit, offset };
}

function paginateFeedPosts(
  items: FeedPostView[],
  options?: ListFeedPostsOptions,
): FeedPostsPage {
  const { limit, offset } = resolveFeedOptions(options);
  const chunk = items.slice(offset, offset + limit + 1);
  const hasMore = chunk.length > limit;
  const posts = hasMore ? chunk.slice(0, limit) : chunk;

  return {
    posts,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
  };
}

function listFeedPostsFromDemo(
  userId: string,
  options?: ListFeedPostsOptions,
): FeedPostsPage {
  const posts = getDemoStore()
    .slice()
    .sort((left, right) => right.createdAtIso.localeCompare(left.createdAtIso))
    .map((post) => mapDemoToView(post, userId));

  return paginateFeedPosts(posts, options);
}

function createFeedPostInDemo(input: CreateFeedPostInput) {
  const now = new Date();

  const post: DemoFeedPost = {
    id: `post-${now.getTime()}`,
    professional: getDisplayNameByUserId(input.authorId),
    professionalRole: input.professionalRole,
    activity: normalizeText(input.activity),
    location: normalizeText(input.location ?? "se.monitora") || "se.monitora",
    image: normalizeText(input.imageUrl ?? fallbackImage) || fallbackImage,
    caption: normalizeText(input.caption),
    createdAtIso: now.toISOString(),
    likedUserIds: [],
    comments: [],
  };

  getDemoStore().unshift(post);

  return mapDemoToView(post, input.authorId);
}

function toggleFeedLikeInDemo(userId: string, postId: string) {
  const post = getDemoStore().find((item) => item.id === postId);

  if (!post) {
    throw new Error("Post não encontrado.");
  }

  if (post.likedUserIds.includes(userId)) {
    post.likedUserIds = post.likedUserIds.filter((id) => id !== userId);
  } else {
    post.likedUserIds.push(userId);
  }

  return mapDemoToView(post, userId);
}

function createFeedCommentInDemo(userId: string, postId: string, text: string) {
  const post = getDemoStore().find((item) => item.id === postId);

  if (!post) {
    throw new Error("Post não encontrado.");
  }

  post.comments.push({
    id: `comment-${Date.now()}`,
    author: getDisplayNameByUserId(userId),
    authorId: userId,
    text: normalizeText(text),
  });

  return mapDemoToView(post, userId);
}

export async function listFeedPosts(
  userId: string,
  options?: ListFeedPostsOptions,
): Promise<FeedPostsPage> {
  const { limit, offset } = resolveFeedOptions(options);

  if (isDemoMode()) {
    return listFeedPostsFromDemo(userId, { limit, offset });
  }

  try {
    const posts = await prisma.feedPost.findMany({
      where: {
        status: {
          in: ["APPROVED", "PUBLISHED"],
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          where: {
            status: {
              in: ["APPROVED", "PUBLISHED"],
            },
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit + 1,
    });

    if (posts.length === 0 && offset === 0) {
      return listFeedPostsFromDemo(userId, { limit, offset });
    }

    const hasMore = posts.length > limit;
    const pageItems = hasMore ? posts.slice(0, limit) : posts;

    return {
      posts: pageItems.map((post) => ({
        id: post.id,
        professional: post.author.name,
        professionalRole: post.professionalRole ?? "Profissional",
        activity: post.activity,
        time: formatWhen(post.createdAt),
        location: post.location ?? "se.monitora",
        image: post.imageUrl ?? fallbackImage,
        caption: post.caption,
        likes: post.likes.length,
        likedByUser: post.likes.some((like) => like.userId === userId),
        comments: post.comments.map((comment) => ({
          id: comment.id,
          author: comment.author.name,
          text: comment.text,
        })),
      })),
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    };
  } catch {
    return listFeedPostsFromDemo(userId, { limit, offset });
  }
}

export async function createFeedPost(input: CreateFeedPostInput) {
  const caption = normalizeText(input.caption);
  const activity = normalizeText(input.activity);

  if (!caption || !activity) {
    throw new Error("Atividade e descrição são obrigatórias.");
  }

  if (isDemoMode()) {
    return createFeedPostInDemo(input);
  }

  try {
    const created = await prisma.feedPost.create({
      data: {
        authorId: input.authorId,
        professionalRole: input.professionalRole,
        activity,
        location: normalizeText(input.location ?? "") || null,
        imageUrl: normalizeText(input.imageUrl ?? "") || null,
        caption,
        status: input.status ?? "PUBLISHED",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      id: created.id,
      professional: created.author.name,
      professionalRole: created.professionalRole ?? "Profissional",
      activity: created.activity,
      time: formatWhen(created.createdAt),
      location: created.location ?? "se.monitora",
      image: created.imageUrl ?? fallbackImage,
      caption: created.caption,
      likes: 0,
      likedByUser: false,
      comments: [],
    };
  } catch {
    return createFeedPostInDemo(input);
  }
}

export async function toggleFeedLike(userId: string, postId: string) {
  if (isDemoMode()) {
    return toggleFeedLikeInDemo(userId, postId);
  }

  try {
    const existingLike = await prisma.feedLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      await prisma.feedLike.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.feedLike.create({
        data: {
          postId,
          userId,
        },
      });
    }

    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          where: {
            status: {
              in: ["APPROVED", "PUBLISHED"],
            },
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!post) {
      throw new Error("Post não encontrado.");
    }

    return {
      id: post.id,
      professional: post.author.name,
      professionalRole: post.professionalRole ?? "Profissional",
      activity: post.activity,
      time: formatWhen(post.createdAt),
      location: post.location ?? "se.monitora",
      image: post.imageUrl ?? fallbackImage,
      caption: post.caption,
      likes: post.likes.length,
      likedByUser: post.likes.some((like) => like.userId === userId),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        author: comment.author.name,
        text: comment.text,
      })),
    };
  } catch {
    return toggleFeedLikeInDemo(userId, postId);
  }
}

export async function createFeedComment(userId: string, postId: string, text: string) {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    throw new Error("Comentário vazio.");
  }

  if (isDemoMode()) {
    return createFeedCommentInDemo(userId, postId, normalizedText);
  }

  try {
    await prisma.feedComment.create({
      data: {
        postId,
        authorId: userId,
        text: normalizedText,
        status: "PUBLISHED",
      },
    });

    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          where: {
            status: {
              in: ["APPROVED", "PUBLISHED"],
            },
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!post) {
      throw new Error("Post não encontrado.");
    }

    return {
      id: post.id,
      professional: post.author.name,
      professionalRole: post.professionalRole ?? "Profissional",
      activity: post.activity,
      time: formatWhen(post.createdAt),
      location: post.location ?? "se.monitora",
      image: post.imageUrl ?? fallbackImage,
      caption: post.caption,
      likes: post.likes.length,
      likedByUser: post.likes.some((like) => like.userId === userId),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        author: comment.author.name,
        text: comment.text,
      })),
    };
  } catch {
    return createFeedCommentInDemo(userId, postId, normalizedText);
  }
}
