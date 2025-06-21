import { Body, Button, Container, Head, Hr, Html, Img, Preview, Section, Text, Link } from "@react-email/components" // Assuming @react-email/components is available or can be installed
import tws from "tailwind-styled-components" // For basic inline styling if needed, or use inline styles directly

interface NewCommentNotificationEmailProps {
  postAuthorName: string
  commenterName: string
  commentContent: string
  postTitle: string
  postUrl: string
  siteName: string
  siteLogoUrl?: string
  siteUrl: string
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

// Basic styled components for email (inline styles are king for email)
const Main = tws.main`font-sans bg-white`
const EmailContainer = tws.div`max-w-[600px] mx-auto p-5`
const LogoImage = tws.img`mx-auto h-12 w-auto`
const HeadingText = tws.h1`text-2xl font-bold text-gray-800 text-center`
const BodyText = tws.p`text-base text-gray-700 leading-relaxed`
const HighlightText = tws.span`font-semibold`
const ButtonLink = tws.a`
  bg-slate-700 text-white font-semibold py-3 px-6 rounded-md
  inline-block text-center no-underline
`
const FooterText = tws.p`text-sm text-gray-500 text-center`

export const NewCommentNotificationEmail = ({
  postAuthorName,
  commenterName,
  commentContent,
  postTitle,
  postUrl,
  siteName,
  siteLogoUrl = `${baseUrl}/logo.png`, // Default site logo
  siteUrl = baseUrl,
}: NewCommentNotificationEmailProps) => {
  const previewText = `${commenterName} commented on your post: "${postTitle}"`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#ffffff" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          <Section style={{ textAlign: "center" }}>
            {siteLogoUrl && (
              <Img src={siteLogoUrl} width="auto" height="50" alt={`${siteName} Logo`} style={{ margin: "0 auto" }} />
            )}
          </Section>

          <HeadingText
            style={{ fontSize: "24px", fontWeight: "bold", color: "#333333", textAlign: "center", marginTop: "20px" }}
          >
            New Comment on Your Post!
          </HeadingText>

          <Section style={{ marginTop: "20px" }}>
            <BodyText style={{ fontSize: "16px", color: "#555555", lineHeight: "1.6" }}>
              Hi <HighlightText style={{ fontWeight: "bold" }}>{postAuthorName}</HighlightText>,
            </BodyText>
            <BodyText style={{ fontSize: "16px", color: "#555555", lineHeight: "1.6" }}>
              You've received a new comment on your post, "
              <HighlightText style={{ fontWeight: "bold" }}>{postTitle}</HighlightText>", from{" "}
              <HighlightText style={{ fontWeight: "bold" }}>{commenterName}</HighlightText>.
            </BodyText>
          </Section>

          <Section
            style={{
              marginTop: "20px",
              padding: "15px",
              border: "1px solid #eeeeee",
              borderRadius: "5px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <Text style={{ fontSize: "16px", color: "#333333", margin: "0 0 10px 0", fontWeight: "bold" }}>
              {commenterName} wrote:
            </Text>
            <Text style={{ fontSize: "15px", color: "#555555", margin: "0", whiteSpace: "pre-wrap" }}>
              {commentContent.length > 300 ? `${commentContent.substring(0, 300)}...` : commentContent}
            </Text>
          </Section>

          <Section style={{ textAlign: "center", marginTop: "30px", marginBottom: "30px" }}>
            <Button
              href={postUrl}
              style={{
                backgroundColor: "#007bff", // Example primary color
                color: "#ffffff",
                padding: "12px 20px",
                textDecoration: "none",
                borderRadius: "5px",
                fontWeight: "bold",
                display: "inline-block",
              }}
            >
              View Comment & Reply
            </Button>
          </Section>

          <Hr style={{ borderColor: "#cccccc", margin: "20px 0" }} />

          <FooterText style={{ fontSize: "12px", color: "#888888", textAlign: "center" }}>
            You are receiving this email because you authored the post and have notifications enabled for new comments.
            You can manage your notification preferences in your profile settings on{" "}
            <Link href={`${siteUrl}/me/profile`} style={{ color: "#007bff" }}>
              {siteName}
            </Link>
            .
          </FooterText>
          <FooterText style={{ fontSize: "12px", color: "#888888", textAlign: "center", marginTop: "5px" }}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </FooterText>
        </Container>
      </Body>
    </Html>
  )
}

NewCommentNotificationEmail.defaultProps = {
  postAuthorName: "Valued Author",
  commenterName: "A Reader",
  commentContent: "This is a sample comment content.",
  postTitle: "Your Amazing Post",
  postUrl: baseUrl,
  siteName: "Our Awesome Site",
  siteLogoUrl: `${baseUrl}/logo.png`,
  siteUrl: baseUrl,
}

export default NewCommentNotificationEmail
