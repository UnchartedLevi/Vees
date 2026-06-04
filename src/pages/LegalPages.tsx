import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

const effectiveDate = "June 4, 2026";

function LegalLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-8 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <nav className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold">
            <span className="inline-flex rounded-2xl bg-slate-900 p-3 text-white"><Sparkles size={17} /></span>
            Vees
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Link className="hover:text-slate-900" to="/privacy">Privacy</Link>
            <Link className="hover:text-slate-900" to="/terms">Terms</Link>
          </div>
        </nav>

        <section className="mt-10 rounded-[2rem] border border-white bg-white p-6 shadow-card sm:p-9 lg:p-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <ShieldCheck size={14} />
            {eyebrow}
          </span>
          <h1 className="mt-6 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Effective date: {effectiveDate}</p>

          <div className="legal-copy mt-9 space-y-8">{children}</div>
        </section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Terms of Service"
      title="Terms of Service for Vees"
      description="These terms explain how Vees may be used as a social media planning, analytics, reporting, and account connection tool."
    >
      <Section title="1. Acceptance of these terms">
        <p>By creating an account, signing in, connecting a social account, or using Vees, you agree to these Terms of Service. If you are using Vees on behalf of a business, school, agency, NGO, or other organization, you confirm that you have permission to accept these terms for that organization.</p>
      </Section>

      <Section title="2. What Vees does">
        <p>Vees helps users plan content, track social media posts, review performance metrics, organize campaigns, generate reports, and receive rule-based content recommendations. Some features may use manually entered data, demo data, or data imported from connected social platforms when those integrations are available and authorized.</p>
      </Section>

      <Section title="3. Accounts and workspaces">
        <p>You are responsible for keeping your login credentials secure and for all activity under your account or workspace. Workspace owners are responsible for the content, social accounts, campaign data, reports, and users they add to Vees.</p>
      </Section>

      <Section title="4. Social platform connections">
        <p>When you connect a social media account, you authorize Vees to access the data allowed by the selected platform and permissions. Vees will only request permissions needed for product features such as account identification, post tracking, analytics syncing, and reporting. Real platform availability depends on each provider's API rules, permissions, review process, and rate limits.</p>
        <p>You may disconnect a social account when supported by the app or revoke access directly from the social platform's account settings.</p>
      </Section>

      <Section title="5. User content and data">
        <p>You retain ownership of the content and data you enter into Vees, including brand information, post captions, campaigns, ideas, reports, and manually tracked analytics. You grant Vees permission to store, process, and display that data only as needed to provide the service.</p>
      </Section>

      <Section title="6. Acceptable use">
        <p>You agree not to use Vees to violate laws, infringe intellectual property rights, misrepresent your connection to a brand or social account, attempt unauthorized access, interfere with the service, or upload malicious code. You are responsible for ensuring that your social media content complies with the rules of each platform you use.</p>
      </Section>

      <Section title="7. Analytics and recommendations">
        <p>Analytics, insights, reports, and assistant responses are provided for planning and informational purposes. They may be based on incomplete, delayed, manually entered, demo, or platform-limited data. Vees does not guarantee specific engagement, reach, follower growth, revenue, or campaign outcomes.</p>
      </Section>

      <Section title="8. Third-party services">
        <p>Vees may rely on third-party services such as Supabase for authentication and data storage, and social media platforms such as TikTok when you choose to connect them. Your use of those third-party services may also be governed by their own terms and policies.</p>
      </Section>

      <Section title="9. Service changes">
        <p>Vees may add, change, suspend, or remove features as the product develops. We may also update these terms from time to time. Continued use of Vees after updates means you accept the revised terms.</p>
      </Section>

      <Section title="10. Disclaimers and limitation of liability">
        <p>Vees is provided on an "as is" and "as available" basis. To the fullest extent permitted by law, Vees disclaims warranties of merchantability, fitness for a particular purpose, and non-infringement. Vees is not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, goodwill, or business opportunities.</p>
      </Section>

      <Section title="11. Contact">
        <p>Questions about these terms should be sent through the contact method published on the official Vees website or developer profile associated with this application.</p>
      </Section>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy Policy"
      title="Privacy Policy for Vees"
      description="This policy explains what information Vees collects, how it is used, and how users can manage their data."
    >
      <Section title="1. Information we collect">
        <p>Vees may collect account information such as name, email address, authentication provider details, workspace membership, and profile metadata. Vees may also collect workspace information such as brand name, industry, audience, brand tone, content goals, connected platforms, campaigns, post ideas, reports, and manually entered analytics.</p>
      </Section>

      <Section title="2. Information from connected social accounts">
        <p>If you connect a social account, Vees may collect information allowed by the permissions you approve, such as platform name, account name, handle, account identifier, public post metadata, captions, content type, posting dates, reach, impressions, likes, comments, shares, saves, and other analytics that the platform makes available.</p>
        <p>For TikTok and other providers, available data depends on approved scopes, API access, platform review status, and the account type you connect.</p>
      </Section>

      <Section title="3. How we use information">
        <p>Vees uses information to authenticate users, create and manage workspaces, connect social accounts, import or track posts, calculate analytics, generate reports, provide content recommendations, troubleshoot issues, improve product reliability, and protect the service from misuse.</p>
      </Section>

      <Section title="4. How information is stored">
        <p>Vees uses Supabase for authentication, database storage, and workspace data. Social access tokens, when used for real integrations, should be stored and encrypted server-side through secure backend functions. Vees does not intentionally store real social access tokens in browser localStorage.</p>
      </Section>

      <Section title="5. Sharing of information">
        <p>Vees does not sell personal information. Information may be shared with service providers that are necessary to operate the product, such as authentication, hosting, database, analytics infrastructure, or connected social platforms when you authorize an integration. Information may also be disclosed if required by law or to protect the security and rights of users and the service.</p>
      </Section>

      <Section title="6. Cookies and local storage">
        <p>Vees may use browser storage and authentication cookies to keep users signed in, remember app state, and support secure sessions. Earlier local-only versions of Vees may use localStorage for mock data or app preferences.</p>
      </Section>

      <Section title="7. Data retention">
        <p>Vees keeps account, workspace, content, analytics, and report data for as long as needed to provide the service, comply with legal obligations, resolve disputes, or maintain security. Users may request deletion of workspace or account data through the contact method published on the official Vees website or developer profile.</p>
      </Section>

      <Section title="8. User choices">
        <p>You can update workspace details in Settings, remove manually entered data where the app provides controls, disconnect social accounts where supported, revoke platform access from the provider's own settings, or request account and workspace deletion.</p>
      </Section>

      <Section title="9. Security">
        <p>Vees is designed to use row-level security, authenticated access, scoped workspace queries, and server-side handling for sensitive integration work. No internet service can guarantee perfect security, but Vees is built to reduce unnecessary exposure of user and workspace data.</p>
      </Section>

      <Section title="10. Children's privacy">
        <p>Vees is intended for use by creators, businesses, schools, agencies, NGOs, and authorized team members. It is not intended for children under 13. If a school or organization uses Vees, it is responsible for ensuring it has the necessary authority and consent to manage related content and data.</p>
      </Section>

      <Section title="11. International users">
        <p>Information may be processed in locations where our service providers operate. By using Vees, you understand that your information may be processed outside your country of residence, subject to applicable law.</p>
      </Section>

      <Section title="12. Changes to this policy">
        <p>Vees may update this Privacy Policy as the product, integrations, laws, or security practices change. The effective date above shows when this policy was last updated.</p>
      </Section>

      <Section title="13. Contact">
        <p>Privacy questions or data requests should be sent through the contact method published on the official Vees website or developer profile associated with this application.</p>
      </Section>
    </LegalLayout>
  );
}
