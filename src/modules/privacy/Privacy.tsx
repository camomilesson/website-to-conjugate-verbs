import { Link } from "react-router"
export function Privacy() {
  return (
    <section className="page-section" aria-labelledby="privacy-title">
      <h1 id="privacy-title">Privacy &amp; your data</h1>
      <p className="field-note">Updated 6 November 2026</p>
      <p>
        La Conjugadora uses account information to sign you in and save your
        Spanish practice. You can practise without an account.
      </p>
      <h2>What is stored</h2>
      <ul>
        <li>
          Guest mode saves your practice preferences in this browser. Guest
          answers and results are not uploaded.
        </li>
        <li>
          Google sign-in supplies your account identifier, email and basic
          profile information, such as name and profile image. Supabase manages
          authentication. This app does not request access to your Gmail, Drive
          or contacts.
        </li>
        <li>
          Your account stores practice preferences, correct/answered counts by
          verb, tense and answer mode, completed-practice summaries, and one
          example mistake per practice. A mistake example includes the submitted
          text, question and accepted answer.
        </li>
        <li>
          Short-lived practice metadata and submission fingerprints prevent
          duplicate counting. The question queue and complete answer-by-answer
          log are not saved, and unfinished practices cannot be resumed.
        </li>
      </ul>
      <h2>Where it is stored</h2>
      <p>
        Vercel hosts the website. Supabase stores account information and
        learning data. Google handles Google sign-in. Authentication session
        information is stored in your browser so you stay signed in. Hosting and
        authentication providers may also process technical logs under their own
        retention settings.
      </p>
      <h2>Retention and controls</h2>
      <p>
        Preferences, learning counts and completed history stay until you reset
        the data or delete your account. Practice submissions expire after 24
        hours. Their metadata and retry fingerprints become eligible for cleanup
        after seven days; cleanup runs when you next start a practice, so
        inactive accounts can retain them longer.
      </p>
      <p>
        In <Link to="/settings">Settings</Link>,{" "}
        <strong>Reset all learning data</strong> removes learning counts,
        history and retry records but keeps your account and preferences. A
        small reset marker remains to prevent old requests from restoring
        cleared data.
      </p>
      <p>
        <strong>Delete account</strong> removes your La Conjugadora
        authentication identity, saved preferences and learning records from the
        active database, then signs this browser out. It does not delete your
        Google account. Signing in again creates a fresh La Conjugadora account.
        Provider backups and logs follow provider retention; deletion from the
        active database does not promise immediate removal from all backups.
      </p>
      <p>
        Browser-local guest preferences are separate: resetting learning data or
        deleting an account does not erase those preferences. You can remove
        them through your browser’s site-data controls.
      </p>
      <h2>Contact</h2>
      <p>
        For questions or help with your data, email{" "}
        <a href="mailto:conjugadora.support@gmail.com">
          conjugadora.support@gmail.com
        </a>
        . Do not email passwords, access tokens or private keys.
      </p>
    </section>
  )
}
