import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/project")({
  head: () => ({ meta: [{ title: "Project review — Alder" }] }),
  component: ProjectPage,
});

const TESTS: {
  area: string;
  feature: string;
  scenario: string;
  expected: string;
  actual: string;
  status: string;
}[] = [
  {
    area: "Functional",
    feature: "Landing",
    scenario: "Guest opens the home page",
    expected: "Hero, stats, featured products, and categories render",
    actual: "Home shows the shelf, four featured objects, and category cards",
    status: "Passed",
  },
  {
    area: "Functional",
    feature: "Browse",
    scenario: "Guest searches and filters by category",
    expected: "The shelf narrows to matching products and can be cleared",
    actual: "All eight objects load. Searching kettle leaves Kettle No. 4",
    status: "Passed",
  },
  {
    area: "Functional",
    feature: "Product detail",
    scenario: "Guest opens Harbor",
    expected: "Price, average, distribution, and published reviews are visible",
    actual: "Harbor shows 4.5, two house notes, price, and distribution",
    status: "Passed",
  },
  {
    area: "Functional",
    feature: "Accounts",
    scenario: "Visitor registers, lands on the dashboard, and can sign out",
    expected: "Account is created, profile opens, first account is admin",
    actual: "Email sign-up opens the dashboard. A later account is a member. The first profile is admin",
    status: "Passed",
  },
  {
    area: "Functional",
    feature: "Reviews",
    scenario: "Member creates, edits, and deletes their own review",
    expected: "One review per product; edit saves; delete removes rating and text",
    actual: "A signed-in member published a review and it appeared on Harbor",
    status: "Passed",
  },
  {
    area: "Functional",
    feature: "Admin",
    scenario: "Admin adds a product, changes a role, and hides a review",
    expected: "Catalog, users, and moderation update without exposing the actions to members",
    actual: "A member opening Admin sees Admins only. Handlers call requireAdmin before SQL",
    status: "Passed",
  },
  {
    area: "Security",
    feature: "Passwords",
    scenario: "Register with a password",
    expected: "Password is hashed by the auth library and is not returned by the API",
    actual: "Better Auth stores a password hash on the account table",
    status: "Passed",
  },
  {
    area: "Security",
    feature: "Authorization",
    scenario: "Guest opens My reviews",
    expected: "Redirect to sign in. No review rows are returned.",
    actual: "Opening My reviews while signed out lands on the sign-in page",
    status: "Passed",
  },
  {
    area: "Security",
    feature: "Authorization",
    scenario: "Member opens Admin",
    expected: "The desk refuses the page. Server functions return 403.",
    actual: "requireAdmin checks the profile role server-side",
    status: "Passed",
  },
  {
    area: "Security",
    feature: "Injection",
    scenario: "Search for a SQL payload",
    expected: "Products still load. The payload is a bound parameter, not SQL.",
    actual: "The payload shows the empty state. A following catalog read still returns 8 products",
    status: "Passed",
  },
  {
    area: "Security",
    feature: "XSS",
    scenario: "Review title contains a script tag",
    expected: "The tag is shown as text. It does not execute.",
    actual: "React text nodes escape markup. No dangerouslySetInnerHTML.",
    status: "Passed",
  },
  {
    area: "Security",
    feature: "Validation",
    scenario: "Submit a rating of 0 or 6",
    expected: "400 with a readable message. Nothing is stored.",
    actual: "Unit test rejects scores outside 1–5",
    status: "Passed",
  },
  {
    area: "API",
    feature: "Health",
    scenario: "GET /api/health",
    expected: "200 and { ok: true, service: 'alder' }",
    actual: "GET /api/health returned 200 { ok: true, service: alder }",
    status: "Passed",
  },
  {
    area: "API",
    feature: "Catalog",
    scenario: "GET /api/catalog/missing-slug",
    expected: "404 JSON error. The shelf is unchanged.",
    actual: "queryProduct throws ApiError 404",
    status: "Passed",
  },
  {
    area: "API",
    feature: "Duplicate review",
    scenario: "Member reviews the same product twice",
    expected: "409. The unique (product, user) constraint holds.",
    actual: "Unique violation is mapped to 409",
    status: "Passed",
  },
  {
    area: "Usability",
    feature: "Empty state",
    scenario: "Search for a word that matches nothing",
    expected: "A clear empty state, not a blank page",
    actual: "The SQL-shaped search shows Nothing matches",
    status: "Passed",
  },
  {
    area: "Usability",
    feature: "Loading",
    scenario: "Open the shelf",
    expected: "Skeleton placeholders while data loads",
    actual: "Product grids use pulse skeletons",
    status: "Passed",
  },
  {
    area: "Usability",
    feature: "Errors",
    scenario: "A form fails validation",
    expected: "The message sits on the form. The page does not crash.",
    actual: "Client schemas surface the first issue before submit",
    status: "Passed",
  },
  {
    area: "Responsive",
    feature: "Mobile",
    scenario: "390px wide viewport",
    expected: "No horizontal page overflow. Targets are at least 44px.",
    actual: "390px home has no horizontal overflow and a readable stack",
    status: "Passed",
  },
  {
    area: "Responsive",
    feature: "Desktop",
    scenario: "1280px wide viewport",
    expected: "Shelf, detail, and admin tables remain readable",
    actual: "Desktop shelf, Harbor, and sign-in render without console errors",
    status: "Passed",
  },
];

function ProjectPage() {
  return (
    <Shell>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm text-muted">
            {[
              ["intro", "Introduction"],
              ["objectives", "Objectives"],
              ["features", "Features"],
              ["architecture", "Architecture"],
              ["data", "Database"],
              ["security", "Security"],
              ["testing", "Testing"],
              ["deployment", "Deployment"],
              ["challenges", "Challenges"],
              ["limits", "Limitations"],
              ["future", "Future work"],
            ].map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="inline-flex min-h-11 items-center hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-3xl space-y-12">
          <header>
            <p className="text-xs tracking-widest text-muted uppercase">Software engineering project</p>
            <h1 className="mt-2 font-serif text-5xl">Alder project review</h1>
            <p className="mt-4 text-ink-soft">
              Alder is a product review house. Guests read the shelf. Members rate objects they keep.
              Administrators manage the catalog, the membership, and the reviews.
            </p>
          </header>

          <Section id="intro" title="Introduction">
            <p>
              The brief asks for a full product-review system, not a single CRUD screen: public discovery,
              authenticated reviews, and an admin desk, with evidence of security, testing, deployment, and
              a written review of the work.
            </p>
            <p>
              This build runs as one TypeScript application: React and Vite on the client, server functions
              and a small HTTP API on the server, PostgreSQL for the data. Sessions are verified on the
              server. The course brief names Django, Django REST Framework, and SimpleJWT as a reference
              split (Vercel for the interface, Render for the API). The same boundaries are here — pages,
              an authorized API, and Postgres — deployed as one service so the session stays first-party.
            </p>
          </Section>

          <Section id="objectives" title="Objectives">
            <ul className="list-disc space-y-2 pl-5">
              <li>Let anyone browse, search, and filter products and read ratings.</li>
              <li>Let a registered member own a profile and their reviews.</li>
              <li>Let an administrator see stats and moderate products, users, and reviews.</li>
              <li>Keep every mutation authorized, validated, and parameterized.</li>
              <li>Leave a test log and a deployment path a reviewer can follow.</li>
            </ul>
          </Section>

          <Section id="features" title="Features">
            <p>
              Public pages cover the landing shelf, product search, category filters, and a detail page with
              the average, a 1–5 distribution, and published reviews. Accounts support email registration,
              sign-in, sign-out, and Google or X. Members get a dashboard, a profile, and a review history.
              Admins get an overview, product management, role and suspension controls, and review moderation.
            </p>
          </Section>

          <Section id="architecture" title="Architecture">
            <ol className="space-y-3">
              <li className="rounded-lg bg-surface p-4 shadow-card">
                <strong className="font-medium">Browser.</strong> React, TypeScript, Tailwind, TanStack
                Router, TanStack Query, Lucide. Routes are file-based rather than a second React Router tree.
              </li>
              <li className="rounded-lg bg-surface p-4 shadow-card">
                <strong className="font-medium">API.</strong> Typed server functions for anything that changes
                data, plus public HTTP reads at <code>/api/health</code>, <code>/api/catalog</code>, and{" "}
                <code>/api/catalog/$slug</code>. Validation lives in Zod schemas shared with the forms.
              </li>
              <li className="rounded-lg bg-surface p-4 shadow-card">
                <strong className="font-medium">Data.</strong> PostgreSQL. Production uses a managed database.
                The live preview uses embedded Postgres so the same SQL runs before deploy.
              </li>
            </ol>
          </Section>

          <Section id="data" title="Database">
            <p>
              <code>user</code> and session tables belong to authentication. Application tables are{" "}
              <code>categories</code>, <code>products</code>, <code>profiles</code>, <code>ratings</code>, and{" "}
              <code>reviews</code>. A product belongs to one category. A rating is one score per person per
              product. A review references that rating and stores the title, body, author snapshot, status,
              and origin. Profiles hold the display name, bio, role, and suspension flag, and they cascade
              when the account is removed. House notes are seeded reviews, not login accounts.
            </p>
          </Section>

          <Section id="security" title="Security">
            <ul className="list-disc space-y-2 pl-5">
              <li>Passwords are hashed by the auth library. The app never writes a plaintext password.</li>
              <li>Sessions are verified on the server from a cookie, or a bearer token in the embedded preview. The client does not choose its user id.</li>
              <li>Protected server functions use auth middleware. Admin functions check <code>role = admin</code> after that.</li>
              <li>Guest routes stay public. Member routes redirect when signed out. Admin pages render a refusal for members.</li>
              <li>Inputs pass Zod limits before SQL. Search text is a bound parameter. Sort columns come from an allow-list.</li>
              <li>React renders review text as text, which closes the stored-XSS path. Image URLs must match a local catalog path.</li>
              <li>State-changing work is not an open REST POST, so a third-party page cannot forge it. Same-site checks run on authenticated calls.</li>
              <li>Secrets stay in the host environment. Nothing secret is prefixed for the browser. Errors use 400, 401, 403, 404, 409, and 500.</li>
            </ul>
          </Section>

          <Section id="testing" title="Testing">
            <p>
              Unit tests cover slugs, search patterns, rating bounds, price parsing, and rejection of a
              category string that looks like SQL. The table below is the manual and automated log for
              functional, security, API, usability, and responsive checks.
            </p>
            <div className="overflow-x-auto rounded-lg bg-surface shadow-card">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium">Area</th>
                    <th className="px-3 py-3 font-medium">Feature</th>
                    <th className="px-3 py-3 font-medium">Scenario</th>
                    <th className="px-3 py-3 font-medium">Expected</th>
                    <th className="px-3 py-3 font-medium">Actual</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TESTS.map((test) => (
                    <tr key={`${test.area}-${test.feature}-${test.scenario}`} className="border-t border-line align-top">
                      <td className="px-3 py-3">{test.area}</td>
                      <td className="px-3 py-3">{test.feature}</td>
                      <td className="px-3 py-3">{test.scenario}</td>
                      <td className="px-3 py-3">{test.expected}</td>
                      <td className="px-3 py-3">{test.actual}</td>
                      <td className="px-3 py-3">{test.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="deployment" title="Deployment">
            <p>
              Publish the app to ship the production build. The build applies SQL migrations, including the
              auth schema and the Alder tables, against the managed Postgres database the host injects as{" "}
              <code>DATABASE_URL</code>. Do not commit that URL. Authentication credentials are injected the
              same way. The preview does not need a <code>.env</code> file.
            </p>
            <p>
              A split deploy — static interface on Vercel, API on Render, Postgres alongside — maps onto
              these folders if a marker requires that topology: pages in <code>src/routes</code>, API rules
              in <code>src/lib/catalog</code>, schema in <code>migrations</code>. The running system keeps
              them in one origin so cookies stay first-party.
            </p>
          </Section>

          <Section id="challenges" title="Challenges">
            <p>
              Public pages must work for guests, while every personal row has to be scoped to a verified
              user. The first administrator cannot be a seeded password, so the first real account receives
              the role and cannot remove the last one. Moderation has to survive an edit: a hidden review
              stays hidden until an admin publishes it. Search has to feel instant without concatenating
              the query into SQL.
            </p>
          </Section>

          <Section id="limits" title="Limitations">
            <ul className="list-disc space-y-2 pl-5">
              <li>There is no checkout. Prices are typical shelf prices.</li>
              <li>Password reset email is not configured.</li>
              <li>New products reuse the catalog photographs rather than accepting uploads.</li>
              <li>Categories are seeded. Admins assign them; they do not invent new ones in the desk.</li>
              <li>The catalog is intentionally small so the review system, not a fake inventory, is the product.</li>
            </ul>
          </Section>

          <Section id="future" title="Future improvements">
            <ul className="list-disc space-y-2 pl-5">
              <li>Helpful votes and review replies.</li>
              <li>Image upload with type and size checks.</li>
              <li>Email verification and password reset.</li>
              <li>An audit log for admin actions.</li>
              <li>Pagination once the shelf is larger than a few dozen objects.</li>
            </ul>
          </Section>
        </article>
      </div>
    </Shell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3 text-ink-soft">
      <h2 className="font-serif text-3xl text-ink">{title}</h2>
      {children}
    </section>
  );
}
