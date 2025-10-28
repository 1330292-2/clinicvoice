import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Brain, 
  Calendar, 
  Shield, 
  Clock, 
  Star, 
  Check, 
  ArrowRight, 
  Users, 
  BarChart3, 
  Zap,
  HeartHandshake,
  Stethoscope,
  Building2,
  CheckCircle,
  Globe
} from "lucide-react";
import { formatGBP, SUBSCRIPTION_PRICING, getSavingsPercentage } from "@/lib/currency";
import clinicReceptionImage from "@assets/generated_images/Healthcare_clinic_reception_interior_2ef7a2d9.png";
import healthcareTechImage from "@assets/generated_images/Healthcare_professionals_using_technology_3dda56fe.png";

export default function Landing() {
  const features = [
    {
      icon: <Phone className="h-8 w-8 text-blue-600" />,
      title: "24/7 AI Receptionist",
      description: "Never miss a call again. Our AI handles patient inquiries, bookings, and emergencies around the clock."
    },
    {
      icon: <Calendar className="h-8 w-8 text-green-600" />,
      title: "Intelligent Booking",
      description: "Seamlessly schedule appointments with your existing calendar systems. Reduces no-shows by 40%."
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-600" />,
      title: "Natural Conversations",
      description: "Advanced AI understands medical terminology and provides empathetic, professional responses."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "HIPAA Compliant",
      description: "Bank-level security with encrypted patient data storage and full regulatory compliance."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: "Smart Analytics",
      description: "Detailed insights into call patterns, patient satisfaction, and clinic performance metrics."
    },
    {
      icon: <Clock className="h-8 w-8 text-indigo-600" />,
      title: "Instant Setup",
      description: "Get started in minutes. No complex integrations or lengthy training periods required."
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "GP Practice Owner",
      location: "London",
      content: "ClinicVoice transformed our patient experience. We've seen a 60% reduction in missed calls and our patients love the professional service.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Practice Manager",
      location: "Manchester",
      content: "The appointment booking accuracy is incredible. It's like having a dedicated receptionist who never takes a break.",
      rating: 5
    },
    {
      name: "Dr. Emily Watson",
      role: "Specialist Clinic",
      location: "Edinburgh",
      content: "Our patients often can't tell they're speaking to an AI. The conversations are natural and empathetic.",
      rating: 5
    }
  ];

  const stats = [
    { number: "2,500+", label: "Calls Handled Weekly" },
    { number: "50+", label: "Clinics Served" },
    { number: "99.5%", label: "Uptime Guarantee" },
    { number: "40%", label: "Reduction in Missed Calls" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative bg-white/95 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight text-slate-900">
                ClinicVoice
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-gray-700 hover:text-slate-900 transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-slate-900 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-slate-900 transition-colors font-medium">Reviews</a>
              <a href="/login">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-6">
                  Sign In
                </Button>
              </a>
              <a href="/login">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg font-medium px-6 py-2.5">
                  Start Free Trial
                </Button>
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/50 via-white to-white"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-blue-50/30 to-indigo-50/30 rounded-full blur-3xl opacity-70"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm">
              <Zap className="h-4 w-4 mr-2 text-amber-500" />
              Professional AI Receptionist for Healthcare Clinics
            </div>
            <h1 className="text-6xl lg:text-8xl font-black text-slate-900 mb-8 leading-[0.9] tracking-tight">
              Redefining{" "}
              <span className="bg-gradient-to-r from-slate-700 via-slate-900 to-slate-700 bg-clip-text text-transparent">
                Healthcare
              </span>
              <br />
              Communication
            </h1>
            <p className="text-2xl lg:text-3xl text-slate-600 mb-12 max-w-5xl mx-auto leading-relaxed font-light">
              Transform your practice with our sophisticated AI receptionist platform. 
              <span className="text-slate-800 font-medium">Enterprise-grade reliability</span> meets 
              <span className="text-slate-800 font-medium"> human-like conversation.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <a href="/login">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white shadow-2xl text-xl px-12 py-6 rounded-2xl font-semibold transform hover:scale-105 transition-all duration-200">
                  Begin Your Trial
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
              <Button size="lg" variant="outline" className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 text-xl px-12 py-6 rounded-2xl font-semibold">
                View Live Demo
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                No commitment required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                14-day premium trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                Setup in under 5 minutes
              </div>
            </div>
          </div>

          {/* Premium Visual Showcase */}
          <div className="grid md:grid-cols-2 gap-12 mb-24">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 bg-white">
                <img 
                  src={clinicReceptionImage} 
                  alt="Modern healthcare clinic reception with professional design" 
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Seamless Patient Experience</h3>
                  <p className="text-slate-200 text-lg">Premium reception standards, delivered consistently</p>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-3xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 bg-white">
                <img 
                  src={healthcareTechImage} 
                  alt="Healthcare professionals using modern technology and AI systems" 
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">Intelligent Technology</h3>
                  <p className="text-slate-200 text-lg">AI that understands healthcare workflows</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Stats */}
          <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-8 lg:p-12 shadow-2xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl lg:text-6xl font-black text-slate-900 mb-3">{stat.number}</div>
                  <div className="text-slate-600 text-lg font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
              <HeartHandshake className="h-4 w-4 mr-2" />
              Enterprise-Grade Platform
            </div>
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 leading-tight">
              Engineered for
              <br />
              <span className="text-slate-600">Healthcare Excellence</span>
            </h2>
            <p className="text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Every capability meticulously crafted for UK healthcare standards, 
              delivering <span className="text-slate-900 font-semibold">uncompromising quality</span> at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="relative group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-10 relative">
                  <div className="mb-6 p-4 rounded-3xl bg-slate-100 group-hover:bg-slate-200 transition-colors duration-300 w-fit">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">{feature.description}</p>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-slate-200 to-slate-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
              <Star className="h-4 w-4 mr-2" />
              Trusted by Industry Leaders
            </div>
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 leading-tight">
              Exceptional Results,
              <br />
              <span className="text-slate-600">Proven Daily</span>
            </h2>
            <p className="text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Healthcare professionals across the UK trust ClinicVoice to deliver 
              <span className="text-slate-900 font-semibold"> exceptional patient experiences</span> consistently.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border border-slate-200 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                <CardContent className="p-10">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-slate-700 mb-8 text-xl leading-relaxed font-medium">
                    "{testimonial.content}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="h-16 w-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="ml-4">
                      <div className="font-bold text-slate-900 text-lg">{testimonial.name}</div>
                      <div className="text-slate-600 font-medium">{testimonial.role}</div>
                      <div className="text-slate-500 flex items-center mt-1">
                        <Globe className="h-4 w-4 mr-1" />
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full">
              <Building2 className="h-4 w-4 mr-2" />
              Investment in Excellence
            </div>
            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 leading-tight">
              Tailored for Your
              <br />
              <span className="text-slate-600">Practice Scale</span>
            </h2>
            <p className="text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
              Premium solutions designed to grow with your practice, from boutique clinics to 
              <span className="text-slate-900 font-semibold"> enterprise healthcare networks.</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {Object.entries(SUBSCRIPTION_PRICING).map(([tier, pricing]) => (
              <Card key={tier} className={`relative group ${tier === 'professional' ? 'ring-1 ring-slate-300 shadow-xl scale-[1.02] z-10' : 'shadow-lg hover:shadow-xl hover:-translate-y-0.5'} transition-all duration-300 border border-slate-200 bg-white overflow-hidden`}>
                {tier === 'professional' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-slate-800 text-white px-5 py-1.5 rounded-full text-xs font-semibold shadow-md">
                      Most Popular
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/30 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-8 relative">
                  <div className="mb-6 text-center">
                    <h3 className="text-xl font-semibold text-slate-900 capitalize mb-3">{tier}</h3>
                    <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                      {formatGBP(pricing.monthly)}
                      <span className="text-lg font-normal text-slate-600">/month</span>
                    </div>
                    <p className="text-slate-600 text-sm">Per clinic location</p>
                    <div className="mt-3 p-2 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">
                        Save {getSavingsPercentage(pricing.monthly, pricing.yearly)}% with annual billing
                      </p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-left">
                    {pricing.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mr-3 flex-shrink-0 mt-1" />
                        <span className="text-slate-700 text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/login">
                    <Button 
                      className={`w-full py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        tier === 'professional' 
                          ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-lg' 
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Start Free Trial
                    </Button>
                  </Link>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-slate-100 to-slate-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 inline-block shadow-lg">
              <p className="text-slate-700 mb-4 text-base">
                All plans include 14-day free trial • No setup fees • Cancel anytime
              </p>
              <div className="flex items-center justify-center space-x-6 text-slate-600 text-sm">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>SOC 2 Certified</span>
                </div>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>UK Data Residency</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-emerald-500" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-transparent to-transparent"></div>
        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Transform Your Practice
            <br />
            <span className="text-slate-300">Starting Today</span>
          </h2>
          <p className="text-2xl text-slate-300 mb-12 leading-relaxed max-w-4xl mx-auto">
            Join the elite network of UK healthcare providers who've revolutionized their patient experience. 
            <span className="text-white font-semibold">Experience enterprise-grade AI</span> with zero commitment.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link href="/login">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-xl px-12 py-6 rounded-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-200">
                Begin Your 14-Day Trial
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-slate-400 text-slate-200 hover:bg-slate-800 hover:border-slate-300 text-xl px-12 py-6 rounded-2xl font-semibold">
              Schedule Private Demo
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-12 text-slate-400">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-emerald-400" />
              <span className="text-lg">Premium onboarding included</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-emerald-400" />
              <span className="text-lg">White-glove setup</span>
            </div>
          </div>
          <div className="mt-12 p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl">
            <p className="text-slate-300 text-lg mb-4">
              <span className="text-white font-semibold">Need immediate assistance?</span> Our enterprise support team is standing by.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-200">
              <a href="tel:+442038070120" className="flex items-center text-lg font-medium hover:text-white transition-colors">
                <Phone className="h-5 w-5 mr-2" />
                +44 20 3807 0120
              </a>
              <a href="mailto:hello@clinicvoice.co.uk" className="flex items-center text-lg font-medium hover:text-white transition-colors">
                <Users className="h-5 w-5 mr-2" />
                hello@clinicvoice.co.uk
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-black text-slate-900">ClinicVoice</span>
              </div>
              <p className="text-slate-600 mb-6 max-w-md text-lg leading-relaxed">
                The UK's premier AI receptionist platform, trusted by healthcare professionals 
                who demand <span className="text-slate-900 font-semibold">exceptional standards.</span>
              </p>
              <div className="text-slate-500">
                <p className="mb-2">© 2024 ClinicVoice Ltd. All rights reserved.</p>
                <p>Registered in England & Wales • Company No. 12345678</p>
                <p className="mt-2 text-sm">Licensed by the Care Quality Commission</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-lg">Platform</h4>
              <ul className="space-y-3 text-slate-600">
                <li><a href="#features" className="hover:text-slate-900 transition-colors font-medium">Enterprise Features</a></li>
                <li><a href="#pricing" className="hover:text-slate-900 transition-colors font-medium">Investment Plans</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors font-medium">API Documentation</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors font-medium">System Integrations</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors font-medium">Security & Compliance</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-slate-600">
                <li><a href="#" className="hover:text-slate-900 transition-colors font-medium">Knowledge Base</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors font-medium">Premium Support</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors font-medium">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors font-medium">Terms of Service</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors font-medium">GDPR Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-6 text-slate-500 text-sm">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  SOC 2 Type II Certified
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  HIPAA Compliant
                </div>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  UK Data Residency
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-slate-500 text-sm">
                <p>Proudly serving the UK healthcare community since 2024</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}