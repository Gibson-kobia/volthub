"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Lock } from "lucide-react";

export default function WholesaleStatusPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          {user ? (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-6">
                Wholesale Application Status
              </h1>

              <div className="space-y-6">
                {/* Applicant Info */}
                <div className="border-b border-slate-200 pb-6">
                  <h2 className="font-semibold text-slate-900 mb-4">Your Details</h2>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600">Full Name</p>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Email</p>
                      <p className="font-semibold text-slate-900">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Phone Number</p>
                      <p className="font-semibold text-slate-900">{user.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="border-b border-slate-200 pb-6">
                  <h2 className="font-semibold text-slate-900 mb-4">Application Status</h2>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900">Pending Review</p>
                      <p className="text-sm text-amber-700">Expected: 24-48 hours</p>
                    </div>
                  </div>
                </div>

                {/* What to Expect */}
                <div>
                  <h2 className="font-semibold text-slate-900 mb-4">What Happens Next</h2>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                        <span className="text-emerald-700 font-semibold">1</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">We Review Your Details</p>
                        <p className="text-sm text-slate-600">Our team verifies your institution/business</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                        <span className="text-emerald-700 font-semibold">2</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">WhatsApp Verification</p>
                        <p className="text-sm text-slate-600">
                          We'll contact you via WhatsApp to confirm details
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                        <span className="text-emerald-700 font-semibold">3</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Account Activated</p>
                        <p className="text-sm text-slate-600">
                          Full access to wholesale portal and bulk pricing
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <h3 className="font-semibold text-emerald-900 mb-2">Questions?</h3>
                  <p className="text-sm text-emerald-800">
                    Contact us on WhatsApp: <span className="font-semibold">+254 (your number)</span>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Lock className="w-16 h-16 mx-auto text-slate-400 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
              <p className="text-slate-600 mb-6">
                Please sign in to check your wholesale application status
              </p>
              <a
                href="/auth/login"
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                Go to Login
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
