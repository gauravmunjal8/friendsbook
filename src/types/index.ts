export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

export interface PostWithDetails {
  id: string;
  content: string | null;
  images: string[];
  createdAt: string;
  author: UserSummary;
  timelineOwner: UserSummary;
  _count: {
    likes: number;
    comments: number;
  };
  liked: boolean;
  comments?: CommentWithAuthor[];
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: string;
  author: UserSummary;
}

export interface FriendshipStatus {
  status: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED";
  friendshipId?: string;
}

export interface MessageData {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
  sender: UserSummary;
}

export interface ConversationData {
  id: string;
  updatedAt: string;
  otherUser: UserSummary | null;
  lastMessage: MessageData | null;
}

export interface ProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthday: string | null;
  hometown: string | null;
  bio: string | null;
  profilePicture: string | null;
  coverPhoto: string | null;
  createdAt: string;
  _count: {
    sentRequests: number;
  };
  friendshipStatus: FriendshipStatus;
}
