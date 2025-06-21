import { Body, Button, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components"
import type { CSSProperties } from "react"

interface ReplyNotificationEmailProps {
  parentCommentAuthorName: string
  replierName: string
  replyContent: string
  originalCommentContent: string
  postTitle: string
  postUrl: string // Should link directly to the reply or parent comment
  siteName: string
  siteLogoUrl?: string
  siteUrl: string
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const ReplyNotificationEmail = ({
  parentCommentAuthorName,
  replierName,
  replyContent,
  originalCommentContent,
  postTitle,
  postUrl,
  siteName,
  siteLogoUrl = `${baseUrl}/logo.png`,
  siteUrl = baseUrl,
}: ReplyNotificationEmailProps) => {
  const previewText = `${replierName} replied to your comment on "${postTitle}"`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ textAlign: "center" }}>
            {siteLogoUrl && <Img src={siteLogoUrl} width="auto" height="50" alt={`${siteName} Logo`} style={logo} />}
          </Section>

          <Text style={heading}>New Reply to Your Comment!</Text>

          <Section style={contentSection}>
            <Text style={paragraph}>
              Hi <strong style={highlight}>{parentCommentAuthorName}</strong>,
            </Text>
            <Text style={paragraph}>
              <strong style={highlight}>{replierName}</strong> replied to your comment on the post "
              <strong style={highlight}>{postTitle}</strong>".
            </Text>

            <Section style={commentBox}>
              <Text style={commentLabel}>Your original comment:</Text>
              <Text style={commentText}>
                {originalCommentContent.length > 200
                  ? `${originalCommentContent.substring(0, 200)}...`
                  : originalCommentContent}
              </Text>
            </Section>

            <Section style={commentBox}>
              <Text style={commentLabel}>{replierName} replied:</Text>
              <Text style={commentText}>{replyContent}</Text>
            </Section>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={postUrl}>
              View Reply & Continue Discussion
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footerText}>
            You are receiving this email because you have notifications enabled for replies to your comments. You can
            manage your notification preferences in your profile settings on{" "}
            <Link href={`${siteUrl}/me/profile`} style={footerLink}>
              {siteName}
            </Link>
            .
          </Text>
          <Text style={footerText}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

ReplyNotificationEmail.defaultProps = {
  parentCommentAuthorName: "Commenter",
  replierName: "Another User",
  replyContent: "This is a sample reply.",
  originalCommentContent: "This was the original comment that was replied to.",
  postTitle: "Amazing Blog Post",
  postUrl: baseUrl,
  siteName: "Our Awesome Site",
  siteLogoUrl: `${baseUrl}/logo.png`,
  siteUrl: baseUrl,
}

export default ReplyNotificationEmail

// Styles
const main: CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container: CSSProperties = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "580px",
  maxWidth: "100%",
}

const logo: CSSProperties = {
  margin: "0 auto",
}

const heading: CSSProperties = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center",
  color: "#333333",
  marginTop: "30px",
}

const contentSection: CSSProperties = {
  padding: "0 20px",
}

const paragraph: CSSProperties = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#555555",
}

const highlight: CSSProperties = {
  fontWeight: "bold",
}

const commentBox: CSSProperties = {
  backgroundColor: "#f9f9f9",
  border: "1px solid #eeeeee",
  borderRadius: "5px",
  padding: "15px",
  marginTop: "20px",
}

const commentLabel: CSSProperties = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#333333",
  margin: "0 0 8px 0",
}

const commentText: CSSProperties = {
  fontSize: "15px",
  color: "#555555",
  margin: "0",
  whiteSpace: "pre-wrap",
}

const buttonSection: CSSProperties = {
  textAlign: "center",
  marginTop: "30px",
  marginBottom: "30px",
}

const button: CSSProperties = {
  backgroundColor: "#007bff", // Example primary color
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 20px",
}

const hr: CSSProperties = {
  borderColor: "#cccccc",
  margin: "20px 0",
}

const footerText: CSSProperties = {
  color: "#888888",
  fontSize: "12px",
  lineHeight: "1.5",
  textAlign: "center",
}

const footerLink: CSSProperties = {
  color: "#007bff",
  textDecoration: "underline",
}
