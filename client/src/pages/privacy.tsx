import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  Clock, 
  Mail, 
  Phone,
  Building,
  Scale,
  UserCheck,
  Database,
  Trash2,
  Download,
  Edit,
  AlertCircle,
  Stethoscope
} from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "November 26, 2025";
  
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2" data-testid="link-back-home">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">VitalRelay</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-slate-900 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
              <p className="text-slate-600">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-lg text-slate-700 leading-relaxed">
            At VitalRelay, we are committed to protecting your privacy and ensuring the security 
            of your personal and health data. This policy explains how we collect, use, and protect 
            your information in compliance with the UK GDPR and Data Protection Act 2018.
          </p>
        </div>

        <div className="space-y-8">
          <Card data-testid="section-data-controller">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                1. Data Controller
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                VitalRelay Ltd is the data controller responsible for your personal data.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-slate-900">Contact Details:</p>
                <div className="flex items-center gap-2 text-slate-700">
                  <Building className="h-4 w-4" />
                  <span>VitalRelay Ltd, 123 Healthcare Street, London, EC1A 1BB</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4" />
                  <span>privacy@clinicvoice.co.uk</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4" />
                  <span>+44 20 3807 0120</span>
                </div>
              </div>
              <p className="text-slate-700">
                Our Data Protection Officer (DPO) can be contacted at dpo@clinicvoice.co.uk for 
                any privacy-related queries or concerns.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-data-collected">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                2. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Personal Data:</h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                  <li>Name, email address, and contact details</li>
                  <li>Clinic and practice information</li>
                  <li>Account credentials and authentication data</li>
                  <li>Usage data and platform interaction logs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Special Category Data (Health Data):</h4>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                  <li>Patient names and contact information (processed on your behalf)</li>
                  <li>Appointment details and medical service types</li>
                  <li>Call recordings and transcripts (where enabled)</li>
                  <li>Health-related conversation content</li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800 text-sm">
                    <strong>Important:</strong> When you use VitalRelay to process patient data, 
                    you act as the data controller for that patient data, and we act as your data processor.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-purposes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                3. Purposes and Legal Basis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 pr-4 font-semibold text-slate-900">Purpose</th>
                      <th className="text-left py-3 font-semibold text-slate-900">Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pr-4">Providing our AI receptionist service</td>
                      <td className="py-3">Contract performance (Article 6(1)(b))</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pr-4">Processing health data on your behalf</td>
                      <td className="py-3">Provision of health care (Article 9(2)(h))</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pr-4">Account security and authentication</td>
                      <td className="py-3">Legitimate interests (Article 6(1)(f))</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pr-4">Service improvement and analytics</td>
                      <td className="py-3">Legitimate interests (Article 6(1)(f))</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-3 pr-4">Legal compliance and auditing</td>
                      <td className="py-3">Legal obligation (Article 6(1)(c))</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">Marketing communications (if opted in)</td>
                      <td className="py-3">Consent (Article 6(1)(a))</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-rights">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-600" />
                4. Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                Under the UK GDPR, you have the following rights regarding your personal data:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Right of Access</p>
                    <p className="text-sm text-slate-600">Request a copy of your personal data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Edit className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Right to Rectification</p>
                    <p className="text-sm text-slate-600">Correct inaccurate personal data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Right to Erasure</p>
                    <p className="text-sm text-slate-600">Request deletion of your data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <Download className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Right to Portability</p>
                    <p className="text-sm text-slate-600">Receive data in machine-readable format</p>
                  </div>
                </div>
              </div>
              <p className="text-slate-700">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:privacy@clinicvoice.co.uk" className="text-blue-600 hover:underline">
                  privacy@clinicvoice.co.uk
                </a>. We will respond within 30 days.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-retention">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                5. Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                We retain your data for as long as necessary to provide our services and comply with 
                legal obligations:
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Call logs and health records</span>
                  <span className="font-medium text-slate-900">7 years (HIPAA compliance)</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Account data</span>
                  <span className="font-medium text-slate-900">Duration of service + 3 years</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Audit logs</span>
                  <span className="font-medium text-slate-900">6 years</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">Marketing preferences</span>
                  <span className="font-medium text-slate-900">Until withdrawn</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="section-security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                6. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                We implement robust security measures to protect your data:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  AES-256 encryption for data at rest and in transit
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Two-factor authentication (2FA) for account access
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  Regular security audits and penetration testing
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  SOC 2 Type II certified infrastructure
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  HIPAA-compliant data handling procedures
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="section-cookies">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600" />
                7. Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                We use cookies to enhance your experience on our platform:
              </p>
              <div className="space-y-3">
                <div className="p-3 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-900">Essential Cookies</p>
                  <p className="text-sm text-slate-600">
                    Required for authentication and security. Cannot be disabled.
                  </p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-900">Functional Cookies</p>
                  <p className="text-sm text-slate-600">
                    Remember your preferences and settings.
                  </p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-900">Analytics Cookies</p>
                  <p className="text-sm text-slate-600">
                    Help us understand how you use our service to improve it.
                  </p>
                </div>
              </div>
              <p className="text-slate-700">
                You can manage your cookie preferences using our cookie settings tool or through 
                your browser settings.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-complaints">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-slate-600" />
                8. Complaints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700">
                If you are unhappy with how we have handled your personal data, you have the right 
                to lodge a complaint with the Information Commissioner's Office (ICO):
              </p>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="font-medium text-slate-900">Information Commissioner's Office</p>
                <p className="text-slate-700">Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF</p>
                <p className="text-slate-700">
                  Website:{" "}
                  <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    ico.org.uk
                  </a>
                </p>
                <p className="text-slate-700">Helpline: 0303 123 1113</p>
              </div>
              <p className="text-slate-700">
                We encourage you to contact us first at{" "}
                <a href="mailto:privacy@clinicvoice.co.uk" className="text-blue-600 hover:underline">
                  privacy@clinicvoice.co.uk
                </a>{" "}
                so we can try to resolve your concerns.
              </p>
            </CardContent>
          </Card>

          <Card data-testid="section-updates">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-indigo-600" />
                9. Policy Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700">
                We may update this privacy policy from time to time. We will notify you of any 
                significant changes by email or through a notice on our platform. The "Last updated" 
                date at the top of this policy indicates when it was last revised.
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        <div className="text-center">
          <p className="text-slate-600 mb-4">
            Have questions about our privacy practices?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:privacy@clinicvoice.co.uk">
              <Button variant="outline" className="w-full sm:w-auto" data-testid="button-contact-privacy">
                <Mail className="h-4 w-4 mr-2" />
                Contact Privacy Team
              </Button>
            </a>
            <Link href="/">
              <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to VitalRelay
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600">
          <p>© 2024 VitalRelay Ltd. All rights reserved.</p>
          <p className="text-sm mt-2">Registered in England & Wales • Company No. 12345678</p>
        </div>
      </footer>
    </div>
  );
}
