"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Gift, TrendingUp, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { WholesaleApplicationForm } from "./wholesale-application-form";

interface WholesalerLockedProps {
  showApplyForm?: boolean;
  onApplySuccess?: () => void;
}

export function WholesalerLocked({ showApplyForm = false, onApplySuccess }: WholesalerLockedProps) {
  const [showForm, setShowForm] = useState(showApplyForm);

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowForm(false)}
            className="mb-8 text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-2 transition-colors"
          >
            ← Back
          </motion.button>
          <WholesaleApplicationForm
            onSuccess={() => {
              onApplySuccess?.();
              setShowForm(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100 flex flex-col"
    >
      {/* Header */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Lock Icon */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20" />
              <Lock className="w-20 h-20 text-emerald-600 relative" />
            </div>
          </motion.div>

          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
              Unlock Wholesale Access
            </h1>
            <p className="text-lg text-slate-600">
              Get bulk pricing, exclusive discounts, and flexible payment terms
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Benefit 1 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-colors"
            >
              <div className="mb-4 inline-block p-3 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Bulk Pricing</h3>
              <p className="text-sm text-slate-600">
                Save up to 40% with our tiered wholesale pricing system
              </p>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-colors"
            >
              <div className="mb-4 inline-block p-3 bg-emerald-100 rounded-lg">
                <Gift className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Special Offers</h3>
              <p className="text-sm text-slate-600">
                Exclusive seasonal promotions for verified partners
              </p>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg p-6 shadow-md border border-emerald-100 hover:border-emerald-300 transition-colors"
            >
              <div className="mb-4 inline-block p-3 bg-emerald-100 rounded-lg">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Fast Checkout</h3>
              <p className="text-sm text-slate-600">
                Quick ordering with WhatsApp integration & M-Pesa support
              </p>
            </motion.div>
          </div>

          {/* Who Can Apply */}
          <div className="bg-white rounded-lg p-8 shadow-lg border border-slate-200 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Who Can Apply?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-emerald-600 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🏫</span> Schools & Institutions
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li>✓ School bursars & canteens</li>
                  <li>✓ Hostels & dining facilities</li>
                  <li>✓ Credit terms available</li>
                  <li>✓ LPO payments accepted</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-emerald-600 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🏪</span> Business & Resellers
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li>✓ Shop owners & traders</li>
                  <li>✓ Supermarkets & kiosks</li>
                  <li>✓ Exclusive bulk discounts</li>
                  <li>✓ M-Pesa & credit options</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {/* Apply Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors shadow-lg"
            >
              Apply for Wholesale <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Check Status Button */}
            <Link
              href="/wholesale/status"
              className="flex items-center justify-center gap-2 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold py-4 px-8 rounded-lg transition-colors"
            >
              Check Application Status
            </Link>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-slate-500">
            <p>Questions? Contact us on WhatsApp: +254 (your number)</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-white border-t border-slate-200 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-900 mb-1">🚚 Free Delivery</p>
              <p>To Meru County on orders above KSh 10,000</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">⚡ Quick Processing</p>
              <p>Application approval within 24-48 hours</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">📱 WhatsApp Support</p>
              <p>Live support for bulk orders</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
