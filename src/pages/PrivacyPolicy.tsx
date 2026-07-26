import { SectionWrapper } from "@/components/SectionWrapper";
import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
  return (
    <SectionWrapper className="pt-32 pb-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy for Manaja Solutions Limited</h1>
        <p className="text-muted-foreground text-sm mb-8">Effective Date: 06/04/2026 &nbsp;|&nbsp; Last Updated: 06/04/2026</p>

        <section className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">Introduction</h2>
          <p>Manaja Solutions Limited ("we", "our", "us") is a technology company that develops and provides tailored software solutions to help organizations manage key business operations such as customer relationships, human resources, finance, inventory, compliance, and analytics.</p>
          <p>We understand that your personal data is important, and we are committed to handling it responsibly. This Privacy Policy explains in clear terms how we collect, use, store, and protect your personal information when you use our services.</p>
          <p>Our data processing activities are guided by the Nigeria Data Protection Act and regulations issued by the Nigeria Data Protection Commission. These laws are designed to ensure that your personal data is used fairly, securely, and transparently.</p>

          <h2 className="text-xl font-semibold text-foreground">Scope of this Policy</h2>
          <p>This Privacy Policy applies to all individuals whose personal data we process. This includes:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>People who use our software platforms</li>
            <li>Visitors who interact with our website</li>
            <li>Clients and organizations that subscribe to our services</li>
            <li>Individuals whose data is entered into our systems by our clients</li>
          </ul>
          <p>In simple terms, if your information is in any system powered by Manaja, this policy applies to you.</p>

          <h2 className="text-xl font-semibold text-foreground">Our Role in Handling Your Data</h2>
          <p>Under data protection law, organizations can act in different roles when handling personal data.</p>
          <h3 className="text-lg font-medium text-foreground">Data Controller</h3>
          <p>This means we decide how and why your personal data is used. For example, when you sign up on our website or contact our support team, we are acting as a Data Controller.</p>
          <h3 className="text-lg font-medium text-foreground">Data Processor</h3>
          <p>This means we process personal data on behalf of another organization (our client). For example, if a company uses Manaja software to manage its employees or customers, we process that data on their instructions.</p>
          <p>Simply put, sometimes we control your data directly, and sometimes we only manage it for our clients.</p>

          <h2 className="text-xl font-semibold text-foreground">Types of Personal Data We Collect and Process</h2>
          <p>Because our platform supports different business functions, we may process different types of personal data, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Customer and Client Information (CRM Data)</strong> — names, phone numbers, email addresses, and records of interactions with customers. This helps businesses manage relationships and communication effectively.</li>
            <li><strong>Employee and HR Information</strong> — employee names, addresses, job roles, salary details, and performance records. This type of data is used for managing staff and payroll.</li>
            <li><strong>Supplier and Procurement Information</strong> — contact details of suppliers, as well as records of orders and transactions.</li>
            <li><strong>Financial and Accounting Information</strong> — billing details, payment records, and transaction histories needed for financial management.</li>
            <li><strong>Property Management Information</strong> — property owner, property addresses, property information, and tenant information.</li>
            <li><strong>Compliance and Risk Information</strong> — audit logs, incident reports, and records showing that users have agreed to company policies.</li>
            <li><strong>Project and Task Information</strong> — work assignments, deadlines, and time tracking data used to monitor productivity.</li>
            <li><strong>Usage and Analytics Data</strong> — information about how users interact with our platform, such as features used and system performance. This helps us improve our services.</li>
            <li><strong>Technical Information</strong> — IP addresses, device type, browser details, and system logs. This data helps us maintain security and troubleshoot issues.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Why We Process Your Data (Purpose of Processing)</h2>
          <p>We use personal data for several important reasons, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and maintain our software services</li>
            <li>To help businesses automate their daily operations</li>
            <li>To manage user accounts, logins, and permissions</li>
            <li>To generate reports, insights, and analytics</li>
            <li>To keep our systems secure and prevent unauthorized access</li>
            <li>To comply with legal and regulatory requirements</li>
            <li>To improve the quality and performance of our services</li>
          </ul>
          <p>In simple terms, we only use your data to run our services effectively, keep them secure, and make them better.</p>

          <h2 className="text-xl font-semibold text-foreground">Legal Basis for Using Your Data</h2>
          <p>The law requires that we have valid reasons (called "legal bases") for processing personal data. These include:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Consent</strong> — when you give us permission to use your data (e.g., accepting cookies or signing up)</li>
            <li><strong>Contract</strong> — when processing is necessary to provide a service you requested</li>
            <li><strong>Legal Obligation</strong> — when we must process data to comply with the law</li>
            <li><strong>Legitimate Interest</strong> — when we use data in a reasonable way that does not harm your rights (e.g., improving security or preventing fraud)</li>
          </ul>
          <p>We always ensure that our use of your data is lawful and fair.</p>

          <h2 className="text-xl font-semibold text-foreground">Sharing Your Data with Others</h2>
          <p>We may share your data with trusted third parties, but only when necessary. These include:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Cloud service providers that host our systems</li>
            <li>Payment processors that handle transactions</li>
            <li>IT support providers that help maintain our platform</li>
            <li>Government or regulatory authorities when required by law</li>
          </ul>
          <p>We do not sell your personal data. Any third party we work with must follow strict data protection and confidentiality rules.</p>

          <h2 className="text-xl font-semibold text-foreground">International Data Transfers</h2>
          <p>Sometimes, your data may be stored or processed outside Nigeria. When this happens, we ensure that:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The country receiving the data has adequate data protection laws, or</li>
            <li>Proper safeguards (such as contracts) are in place to protect your data</li>
          </ul>
          <p>This ensures your information remains safe, no matter where it is processed.</p>

          <h2 className="text-xl font-semibold text-foreground">How Long We Keep Your Data (Data Retention)</h2>
          <p>We only keep your personal data for as long as necessary. This depends on:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The purpose for which the data was collected</li>
            <li>Legal or regulatory requirements</li>
            <li>The need to resolve disputes or enforce agreements</li>
          </ul>
          <p>When your data is no longer needed, we securely delete it or make it anonymous so it cannot be linked back to you.</p>

          <h2 className="text-xl font-semibold text-foreground">How We Protect Your Data (Security Measures)</h2>
          <p>We take data security seriously and use multiple safeguards to protect your information, including:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Restricting access to only authorized personnel</li>
            <li>Encrypting sensitive data to prevent unauthorized access</li>
            <li>Using secure login systems (such as multi-factor authentication)</li>
            <li>Monitoring systems for suspicious activity</li>
            <li>Regularly testing and improving our security measures</li>
          </ul>
          <p>These steps help reduce the risk of data breaches and unauthorized access.</p>

          <h2 className="text-xl font-semibold text-foreground">Your Rights Over Your Data</h2>
          <p>Under the NDPA, you have several rights regarding your personal data. These include the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Request access to the data we hold about you</li>
            <li>Ask us to correct inaccurate or incomplete information</li>
            <li>Request deletion of your data (where applicable)</li>
            <li>Object to certain types of processing</li>
            <li>Withdraw your consent at any time</li>
            <li>Request a copy of your data in a portable format</li>
          </ul>
          <p>If you would like to exercise any of these rights, you can contact us using the details below.</p>

          <h2 className="text-xl font-semibold text-foreground">Cookies and Tracking Technologies</h2>
          <p>We use cookies (small files stored on your device) and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Make our platform work properly</li>
            <li>Improve your user experience</li>
            <li>Understand how our services are used</li>
          </ul>
          <p>You can control or disable cookies through your browser settings at any time. For full details, see our <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.</p>

          <h2 className="text-xl font-semibold text-foreground">Children's Data</h2>
          <p>Our services are designed for businesses and are not intended for individuals under the age of 18. We do not knowingly collect or process personal data belonging to children.</p>

          <h2 className="text-xl font-semibold text-foreground">Data Breach Management</h2>
          <p>Although we take strong security measures, no system is completely risk-free. In the event of a data breach, we will:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Act quickly to contain and investigate the issue</li>
            <li>Notify affected users where necessary</li>
            <li>Report the incident to the appropriate authority as required by law</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Updates to this Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes in our services or legal requirements. When we do, we will notify users through our website or platform.</p>

          <h2 className="text-xl font-semibold text-foreground">Contact Details</h2>
          <p>If you have any questions or concerns about this Privacy Policy or how your data is handled, please contact:</p>
          <p><strong>Data Protection Officer (DPO)</strong><br />
          Manaja Solutions Limited<br />
          Email: <a href="mailto:dpo@manaja.solutions" className="text-primary hover:underline">dpo@manaja.solutions</a>, <a href="mailto:feedback@manaja.solutions" className="text-primary hover:underline">feedback@manaja.solutions</a><br />
          Phone: +2348032710417<br />
          Address: Lagos, Nigeria</p>

          <h2 className="text-xl font-semibold text-foreground">Complaints and Redress</h2>
          <p>If you believe your personal data has been handled improperly, you have the right to file a complaint with the Nigeria Data Protection Commission (<a href="mailto:info@ndpc.gov.ng" className="text-primary hover:underline">info@ndpc.gov.ng</a>), which is the authority responsible for enforcing data protection laws in Nigeria.</p>
        </section>
      </div>
    </SectionWrapper>
  );
}
