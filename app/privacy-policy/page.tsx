import { SiteHeader } from "@/components/site-header"
import { getAllPosts } from "@/lib/posts"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  const allPosts = getAllPosts()

  return (
    <>
      <SiteHeader allPosts={allPosts} />
      <div className="container mx-auto px-4 py-12">
        <div className="prose prose-invert mx-auto max-w-3xl">
          <h1>Privacy Policy</h1>
          <p>
            <strong>Last Updated:</strong> June 18, 2025
          </p>
          <p>
            Welcome to ByteSkill. We are committed to protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you visit our website. Please read this privacy
            policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>
          <h2>Collection of Your Information</h2>
          <p>
            We may collect information about you in a variety of ways. The information we may collect on the Site
            includes:
          </p>
          <h3>Personal Data</h3>
          <p>
            Personally identifiable information, such as your name and email address, that you voluntarily give to us
            when you use the feedback form. You are under no obligation to provide us with personal information of any
            kind; however, your refusal to do so may prevent you from using certain features of the Site.
          </p>
          <h3>Usage Data</h3>
          <p>
            Information our servers automatically collect when you access the Site, such as your IP address, your
            browser type, your operating system, your access times, and the pages you have viewed directly before and
            after accessing the Site.
          </p>
          <h2>Use of Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with a smooth, efficient, and customized
            experience. Specifically, we may use information collected about you via the Site to:
          </p>
          <ul>
            <li>Respond to your feedback and support requests.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
            <li>Improve our website and service offerings.</li>
          </ul>
          <h2>Disclosure of Your Information</h2>
          <p>
            We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information.
            This does not include trusted third parties who assist us in operating our website, conducting our business,
            or servicing you, so long as those parties agree to keep this information confidential.
          </p>
          <h2>Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information.
            While we have taken reasonable steps to secure the personal information you provide to us, please be aware
            that despite our efforts, no security measures are perfect or impenetrable, and no method of data
            transmission can be guaranteed against any interception or other type of misuse.
          </p>
          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this
            Privacy Policy periodically for any changes.
          </p>
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through our{" "}
            <Link href="/feedback">Feedback Page</Link>.
          </p>
        </div>
      </div>
    </>
  )
}
