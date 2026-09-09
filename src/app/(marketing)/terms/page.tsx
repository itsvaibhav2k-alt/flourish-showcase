import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - Flourish",
  description: "Flourish's terms of service governing use of our platform and services.",
}

export default function TermsPage() {
  return (
    <div className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-instrument-sans uppercase tracking-[0.25em] text-sm text-primary-600 mb-4">
              Legal
            </p>
            <h1 className="text-4xl md:text-5xl font-instrument-serif font-normal text-neutral-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-neutral-500">
              Last updated: January 2025
            </p>
          </div>

          <div className="prose prose-neutral max-w-none">
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-card p-8 md:p-10 space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Agreement to Terms</h2>
                <p className="text-neutral-600 leading-relaxed">
                  By accessing or using Flourish (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you disagree with any part of these terms, you may not access the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Description of Service</h2>
                <p className="text-neutral-600 leading-relaxed">
                  Flourish is a customer relationship management (CRM) platform designed for mission-driven organizations. Our Service includes donor management, volunteer coordination, AI-powered communications, and related features.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Account Registration</h2>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  To use certain features of the Service, you must register for an account. When you register, you agree to:
                </p>
                <ul className="list-disc list-inside text-neutral-600 space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Acceptable Use</h2>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-neutral-600 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Send spam or unsolicited communications</li>
                  <li>Upload malicious code or interfere with the Service</li>
                  <li>Attempt to gain unauthorized access to any systems</li>
                  <li>Collect user information without consent</li>
                  <li>Impersonate others or misrepresent your affiliation</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Your Data</h2>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  You retain all rights to the data you upload to the Service (&ldquo;Your Data&rdquo;). By using the Service, you grant us a limited license to use Your Data solely to provide and improve the Service.
                </p>
                <p className="text-neutral-600 leading-relaxed">
                  You are responsible for ensuring you have the right to upload and use any data you provide, including compliance with applicable privacy laws and obtaining necessary consents from individuals whose data you store.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">AI Features</h2>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  Our Service includes AI-powered features for generating communications and insights. You acknowledge that:
                </p>
                <ul className="list-disc list-inside text-neutral-600 space-y-2">
                  <li>AI-generated content should be reviewed before use</li>
                  <li>You are responsible for all content sent from your account</li>
                  <li>AI features may not always produce perfect results</li>
                  <li>We may use anonymized data to improve AI models</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Payment Terms</h2>
                <p className="text-neutral-600 leading-relaxed">
                  During the beta period, the Service is provided free of charge. When paid plans are introduced, we will provide advance notice of pricing and billing terms. Continued use after pricing takes effect constitutes acceptance of those terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Intellectual Property</h2>
                <p className="text-neutral-600 leading-relaxed">
                  The Service and its original content (excluding Your Data), features, and functionality are owned by Flourish and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Disclaimers</h2>
                <p className="text-neutral-600 leading-relaxed">
                  THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Limitation of Liability</h2>
                <p className="text-neutral-600 leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLOURISH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Indemnification</h2>
                <p className="text-neutral-600 leading-relaxed">
                  You agree to indemnify and hold harmless Flourish and its officers, directors, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service or violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Termination</h2>
                <p className="text-neutral-600 leading-relaxed">
                  We may terminate or suspend your account and access to the Service at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Changes to Terms</h2>
                <p className="text-neutral-600 leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms and updating the &ldquo;Last updated&rdquo; date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Governing Law</h2>
                <p className="text-neutral-600 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Contact Us</h2>
                <p className="text-neutral-600 leading-relaxed">
                  If you have questions about these Terms, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-700">
                    <strong>Email:</strong> legal@flourish.app<br />
                    <strong>Address:</strong> Flourish, Inc.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
