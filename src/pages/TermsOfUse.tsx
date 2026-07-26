import { SectionWrapper } from "@/components/SectionWrapper";
import { Link } from "react-router-dom";

export default function TermsOfUsePage() {
  return (
    <SectionWrapper className="pt-32 pb-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Use for Manaja Solutions Limited</h1>
        <p className="text-muted-foreground text-sm mb-8">Effective Date: 06/04/2026 &nbsp;|&nbsp; Last Updated: 06/04/2026</p>

        <section className="space-y-4 text-muted-foreground text-sm leading-relaxed">
          <h2 className="text-xl font-semibold text-foreground">Introduction</h2>
          <p>Welcome to Manaja Solutions Limited ("Company", "we", "our", "us"), a technology company that provides tailored software solutions to help organizations manage business operations including CRM, HR & Payroll, Inventory, Accounting, Compliance, Project Management, and Analytics.</p>
          <p>By accessing or using our platform, you ("User", "Client") agree to be bound by these Terms of Use. If you do not agree, you must not use our services.</p>

          <h2 className="text-xl font-semibold text-foreground">Eligibility</h2>
          <p>You must be at least 18 years old and legally capable of entering into a binding contract to use our services.</p>
          <p>Where you are using the platform on behalf of an organization, you represent that you are authorized to bind that organization to these Terms.</p>

          <h2 className="text-xl font-semibold text-foreground">Nature of Services</h2>
          <p>Manaja provides a cloud-based platform that enables businesses to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Manage customer relationships (CRM)</li>
            <li>Handle HR and payroll processes</li>
            <li>Track inventory and procurement</li>
            <li>Perform accounting and financial reporting</li>
            <li>Manage properties, leases, and facility operations (Real Estate & Facilities)</li>
            <li>Manage compliance and risk</li>
            <li>Track projects and tasks</li>
            <li>Generate analytics and automate workflows</li>
          </ul>
          <p>We reserve the right to modify, suspend, or discontinue any part of the services at any time.</p>

          <h2 className="text-xl font-semibold text-foreground">User Responsibilities</h2>
          <p>You agree to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide accurate and up-to-date information</li>
            <li>Maintain the confidentiality of your login credentials</li>
            <li>Use the platform only for lawful business purposes</li>
            <li>Ensure that any personal data uploaded complies with applicable data protection laws, including the NDPA</li>
          </ul>
          <p>You must not:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the platform for unlawful or fraudulent activities</li>
            <li>Attempt unauthorized access to the system</li>
            <li>Interfere with system security or performance</li>
            <li>Upload malicious code or harmful content</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Data Protection and Privacy</h2>
          <p>Manaja processes personal data in accordance with the Nigeria Data Protection Act (NDPA), 2023, under the supervision of the Nigeria Data Protection Commission.</p>
          <h3 className="text-lg font-medium text-foreground">Roles</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Clients act as Data Controllers</li>
            <li>Manaja acts primarily as a Data Processor</li>
          </ul>
          <h3 className="text-lg font-medium text-foreground">Client Obligations</h3>
          <p>Clients are responsible for:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Obtaining valid consent from data subjects</li>
            <li>Ensuring lawful basis for processing</li>
            <li>Responding to data subject rights requests</li>
          </ul>
          <h3 className="text-lg font-medium text-foreground">Manaja Obligations</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Implement appropriate security measures</li>
            <li>Process data only on documented instructions</li>
            <li>Assist clients with compliance obligations</li>
          </ul>
          <p>For more details, please refer to our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.</p>

          <h2 className="text-xl font-semibold text-foreground">Intellectual Property Rights</h2>
          <p>All rights, title, and interest in the platform, including software, design, trademarks, and content, remain the exclusive property of Manaja.</p>
          <p>You are granted a limited, non-exclusive, non-transferable license to use the platform for business purposes.</p>

          <h2 className="text-xl font-semibold text-foreground">Subscription, Fees, and Payment</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access to certain features may require payment</li>
            <li>Fees are billed based on agreed plans</li>
            <li>Payments are non-refundable unless otherwise stated</li>
            <li>Failure to pay may result in suspension or termination of services</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Service Availability and Support</h2>
          <p>We strive to ensure high availability but do not guarantee uninterrupted access. We may perform maintenance that may temporarily affect service availability.</p>

          <h2 className="text-xl font-semibold text-foreground">Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Manaja shall not be liable for:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Indirect or consequential damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Service interruptions beyond our reasonable control</li>
          </ul>
          <p>Total liability shall not exceed the amount paid for services within the preceding period (e.g., 12 months).</p>

          <h2 className="text-xl font-semibold text-foreground">Indemnification</h2>
          <p>You agree to indemnify and hold Manaja harmless from any claims, damages, or liabilities arising from:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your use of the platform</li>
            <li>Breach of these Terms</li>
            <li>Violation of applicable laws or third-party rights</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Termination</h2>
          <p>We may suspend or terminate your access:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>For breach of these Terms</li>
            <li>For non-payment</li>
            <li>Where required by law</li>
          </ul>
          <p>Upon termination:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access to the platform may be revoked</li>
            <li>Data may be deleted in accordance with our retention policy</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Confidentiality</h2>
          <p>Both parties agree to maintain the confidentiality of sensitive information disclosed during the course of using the platform.</p>

          <h2 className="text-xl font-semibold text-foreground">Third-Party Services</h2>
          <p>Our platform may integrate with third-party tools. We are not responsible for the practices or content of those third parties.</p>

          <h2 className="text-xl font-semibold text-foreground">Changes to Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the platform constitutes acceptance of the updated Terms.</p>

          <h2 className="text-xl font-semibold text-foreground">Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.</p>

          <h2 className="text-xl font-semibold text-foreground">Dispute Resolution</h2>
          <p>Any disputes arising from these Terms shall be resolved through:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Amicable negotiation</li>
            <li>Failing which, through arbitration or courts of competent jurisdiction in Nigeria</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Contact Information</h2>
          <p>For inquiries regarding these Terms:</p>
          <p><strong>Manaja Solutions Limited</strong><br />
          Email: <a href="mailto:dpo@manaja.solutions" className="text-primary hover:underline">dpo@manaja.solutions</a>, <a href="mailto:feedback@manaja.solutions" className="text-primary hover:underline">feedback@manaja.solutions</a><br />
          Phone: +2348032710417<br />
          Address: Lagos, Nigeria</p>
        </section>
      </div>
    </SectionWrapper>
  );
}
