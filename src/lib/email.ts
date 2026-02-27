import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL ?? "notifications@friendsbook.app";
const SITE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

type NotifType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "TIMELINE_POST";

function buildEmail(
  actorName: string,
  type: NotifType
): { subject: string; text: string } {
  switch (type) {
    case "FRIEND_REQUEST":
      return {
        subject: `${actorName} sent you a friend request`,
        text: `${actorName} sent you a friend request on Friendsbook.\n\nView it here: ${SITE_URL}/friends`,
      };
    case "FRIEND_ACCEPTED":
      return {
        subject: `${actorName} accepted your friend request`,
        text: `${actorName} accepted your friend request on Friendsbook.\n\nView their profile: ${SITE_URL}`,
      };
    case "POST_LIKED":
      return {
        subject: `${actorName} liked your post`,
        text: `${actorName} liked your post on Friendsbook.\n\nView it here: ${SITE_URL}`,
      };
    case "POST_COMMENTED":
      return {
        subject: `${actorName} commented on your post`,
        text: `${actorName} commented on your post on Friendsbook.\n\nView it here: ${SITE_URL}`,
      };
    case "TIMELINE_POST":
      return {
        subject: `${actorName} posted on your timeline`,
        text: `${actorName} posted on your timeline on Friendsbook.\n\nView it here: ${SITE_URL}`,
      };
  }
}

export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  actorName: string,
  type: NotifType
) {
  const { subject, text } = buildEmail(actorName, type);
  await resend.emails.send({
    from: FROM,
    to: recipientEmail,
    subject,
    text: `Hi ${recipientName},\n\n${text}\n\n— Friendsbook`,
  });
}
