import { SiteHeader } from "@/components/site-header"
import { getAllPosts } from "@/lib/posts"
import Link from "next/link"

export default function TermsOfServicePage() {
  const allPosts = getAllPosts()

  return (
    <>
      <SiteHeader allPosts={allPosts} />
      <div className="container mx-auto px-4 py-12">
        <div className="prose prose-invert mx-auto max-w-3xl">
          <h1>Terms of Service</h1>
          <p>
            <strong>Last Updated:</strong> June 18, 2025
          </p>
          <h2>1. Agreement to Terms</h2>
          <p>
            By using our website, ByteSkill (the &quot;Site&quot;), you agree to be bound by these Terms of Service. If
            you do not agree to these terms, please do not use the Site.
          </p>
          <h2>2. Intellectual Property Rights</h2>
          <p>
            Unless otherwise indicated, the Site is our proprietary property and all source code, databases,
            functionality, software, website designs, audio, video, text, photographs, and graphics on the Site
            (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”)
            are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
          </p>
          <h2>3. User Representations</h2>
          <p>
            By using the Site, you represent and warrant that: (1) you have the legal capacity and you agree to comply
            with these Terms of Service; (2) you are not a minor in the jurisdiction in which you reside; (3) you will
            not access the Site through automated or non-human means, whether through a bot, script or otherwise; (4)
            you will not use the Site for any illegal or unauthorized purpose; and (5) your use of the Site will not
            violate any applicable law or regulation.
          </p>
          <h2>4. Prohibited Activities</h2>
          <p>
            You may not access or use the Site for any purpose other than that for which we make the Site available. The
            Site may not be used in connection with any commercial endeavors except those that are specifically endorsed
            or approved by us.
          </p>
          <h2>5. Site Management</h2>
          <p>
            We reserve the right, but not the obligation, to: (1) monitor the Site for violations of these Terms of
            Service; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or
            these Terms of Service; (3) in our sole discretion and without limitation, refuse, restrict access to, limit
            the availability of, or disable any of your contributions or any portion thereof.
          </p>
          <h2>6. Term and Termination</h2>
          <p>
            These Terms of Service shall remain in full force and effect while you use the Site. WITHOUT LIMITING ANY
            OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT
            NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SITE (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY
            PERSON FOR ANY REASON OR FOR NO REASON.
          </p>
          <h2>7. Modifications and Interruptions</h2>
          <p>
            We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at
            our sole discretion without notice. We also reserve the right to modify or discontinue all or part of the
            Site without notice at any time. We will not be liable to you or any third party for any modification, price
            change, suspension, or discontinuance of the Site.
          </p>
          <h2>8. Governing Law</h2>
          <p>
            These Terms of Service and your use of the Site are governed by and construed in accordance with the laws of
            the applicable jurisdiction without regard to its conflict of law principles.
          </p>
          <h2>9. Disclaimer</h2>
          <p>
            THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR
            SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
            EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE
            IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <h2>10. Contact Us</h2>
          <p>
            In order to resolve a complaint regarding the Site or to receive further information regarding use of the
            Site, please contact us through our <Link href="/feedback">Feedback Page</Link>.
          </p>
        </div>
      </div>
    </>
  )
}
