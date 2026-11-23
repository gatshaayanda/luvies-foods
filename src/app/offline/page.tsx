import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="lf-store">
      <section className="lf-menu-section" style={{ maxWidth: 760, margin: "48px auto", padding: 24 }}>
        <div className="lf-eyebrow">LUVIE'S FOODS · OFFLINE MODE</div>
        <h1>Still here, even without a connection.</h1>
        <p>The Luvie's Foods app shell, essential scripts and styles, and this offline page are saved on this device after a successful online visit. The service worker keeps the previous working version available while a new version waits for your choice to refresh.</p>
        <p>Your previously loaded menu and business settings can be available from Firestore's persistent on-device cache. Menu photos that have been viewed, plus eligible UploadThing and Unsplash images, may also be available offline. Media caching is size-limited; video and uncached images still need a connection.</p>
        <p>Customer and owner pages are protected and are not served from a public page cache. Firestore uses persistent local storage for previously accessed records and can retain supported writes while offline; those writes sync when the connection returns. A saved local write is not proof that the server accepted it. Keep the app open or reopen it when connected to allow pending work to finish, then check the order or record status before retrying.</p>
        <p>Firebase authentication, new sign-ins, server APIs, UploadThing uploads, push notifications and other network services may need an internet connection. New media selected while offline is not automatically uploaded unless the relevant form explicitly offers a pending-upload state.</p>
        <p><strong>Before going offline:</strong> open the Store and allow the menu and its images to load, then open the Account and Briefcase pages once while connected if you expect to use their previously cached Firestore data. Reopen the app online periodically to receive updates.</p>
        <div className="lf-hero-actions">
          <Link className="lf-primary" href="/">Return to Luvie's Foods</Link>
          <Link className="lf-secondary" href="/account">Customer account</Link>
        </div>
      </section>
    </main>
  );
}
