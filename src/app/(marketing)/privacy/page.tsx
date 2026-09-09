import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Flourish",
  description: "Flourish's privacy policy explaining how we collect, use, and protect your data.",
}

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-instrument-sans uppercase tracking-[0.25em] text-sm text-primary-600 mb-4">
              Legal
            </p>
            <h1 className="text-4xl md:text-5xl font-instrument-serif font-normal text-neutral-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-neutral-500">
              Last updated: January 2025
            </p>
          </div>

          <div className="prose prose-neutral max-w-none">
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-card p-8 md:p-10 space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Introduction</h2>
                <p className="text-neutral-600 leading-relaxed">
                  Flourish (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
                </p>
                <p className="text-neutral-600 leading-relaxed mt-4">
                  By using Flourish, you agree to the collection and use of information in accordance with this policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Information We Collect</h2>

                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Information You Provide</h3>
                <ul className="list-disc list-inside text-neutral-600 space-y-2 mb-4">
                  <li>Account information (name, email, organization details)</li>
                  <li>Contact and supporter data you upload or enter</li>
                  <li>Donation and volunteer records</li>
                  <li>Communications and messages sent through our platform</li>
                  <li>Support requests and feedback</li>
                </ul>

                <h3 className="text-lg font-semibold text-neutral-800 mb-2">Information Collected Automatically</h3>
                <ul className="list-disc list-inside text-neutral-600 space-y-2">
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                  <li>Usage data and analytics</li>
                  <li>Cookies and similar technologies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">How We Use Your Information</h2>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-neutral-600 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send administrative messages and updates</li>
                  <li>Respond to your comments, questions, and support requests</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Detect, prevent, and address technical issues and fraud</li>
                  <li>Train and improve our AI features (using anonymized data)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Data Sharing and Disclosure</h2>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-neutral-600 space-y-2">
                  <li><strong>Service providers:</strong> Third parties who assist in operating our platform</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business transfers:</strong> In connection with a merger or acquisition</li>
                  <li><strong>With your consent:</strong> When you explicitly authorize us to share</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Data Security</h2>
                <p className="text-neutral-600 leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your information, including:
                </p>
                <ul className="list-disc list-inside text-neutral-600 space-y-2 mt-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and audits</li>
                  <li>Access controls and authentication measures</li>
                  <li>Secure data centers with physical security measures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Your Rights</h2>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-neutral-600 space-y-2">
                  <li>Access and receive a copy of your data</li>
                  <li>Correct inaccurate or incomplete information</li>
                  <li>Delete your personal information</li>
                  <li>Object to or restrict certain processing</li>
                  <li>Data portability</li>
                  <li>Withdraw consent at any time</li>
                </ul>
                <p className="text-neutral-600 leading-relaxed mt-4">
                  To exercise these rights, please contact us at privacy@flourish.app.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Data Retention</h2>
                <p className="text-neutral-600 leading-relaxed">
                  We retain your information for as long as your account is active or as needed to provide services. We may also retain certain information as required by law or for legitimate business purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Children&apos;s Privacy</h2>
                <p className="text-neutral-600 leading-relaxed">
                  Flourish is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children under 16.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Changes to This Policy</h2>
                <p className="text-neutral-600 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Contact Us</h2>
                <p className="text-neutral-600 leading-relaxed">
                  If you have questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-700">
                    <strong>Email:</strong> privacy@flourish.app<br />
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
