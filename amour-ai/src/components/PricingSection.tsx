import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { plans } from "@/data/plans";
import { useAuth } from "@/context/AuthContext";

// A single-file React component that replicates the Pricing UI from the provided mock
// and also contains the Razorpay integration (keeps your existing payment logic).

function loadRazorpayScript(src = "https://checkout.razorpay.com/v1/checkout.js") {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("window is undefined"));
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });
}

export default function RazorpayPaymentPricingUI() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { fetchUser } = useAuth();

  const handleBuy = async (plan, index) => {
    setSelectedIndex(index);
    setIsProcessing(true);
    try {
      const createRes = await axios.post("/api/payment/create-order", {
        amount: plan.price,
        currency: "INR",
        credits: plan.credits,
        description: `${plan.credits} credits - ${plan.name}`,
      });

      if (!createRes?.data?.success) throw new Error(createRes?.data?.error || "failed_to_create_order");

      const order = createRes.data.order;
      if (!order || !order.id) throw new Error("invalid_order_from_backend");

      await loadRazorpayScript();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || createRes.data.key,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Your App Name",
        description: `Buy ${plan.credits} credits`,
        order_id: order.id,
        handler: async function (razorResp) {
          try {
            const verifyRes = await axios.post("/api/payment/verify-payment", {
              razorpay_payment_id: razorResp.razorpay_payment_id,
              razorpay_order_id: razorResp.razorpay_order_id,
              razorpay_signature: razorResp.razorpay_signature,
              amountRupees: plan.price,
              metadata: { credits: plan.credits, planName: plan.name },
            });

            if (!verifyRes?.data?.success) {
              toast({ title: "Verification failed", description: verifyRes?.data?.error || "Could not verify payment", variant: "destructive" });
              return;
            }

            toast({ title: "Payment Success", description: `Credited ${plan.credits} credits`, variant: "success" });
            navigate("/", { replace: true });
          } catch (err) {
            console.error("verification error", err);
            toast({ title: "Verification error", description: "Failed to confirm payment. Contact support.", variant: "destructive" });
          }
        },
        prefill: { name: "", email: "", contact: "" },
        notes: { credits: String(plan.credits) },
        theme: { color: "#ea5810" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        toast({ title: "Payment failed", description: response?.error?.description || "Payment not completed", variant: "destructive" });
      });
      fetchUser();
      rzp.open();
    } catch (err) {
      console.error(err);
      toast({ title: "Payment error", description: (err && err.message) || "Something went wrong", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="py-24 bg-[#070707] relative overflow-hidden font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-[520px] h-[520px] bg-orange-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent pb-2">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Select the perfect toolkit to accelerate your success and get credits instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={index}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseLeave={() => setSelectedIndex(1)}
                className={`relative flex flex-col rounded-3xl p-8 transition-all duration-300 cursor-pointer
                  ${plan.popular ? 'bg-[#1a1a1a] border-2 border-orange-500 shadow-[0_0_50px_-10px_rgba(234,88,12,0.3)] scale-105' : isSelected ? 'bg-[#171717] scale-105 border border-white/10 shadow-lg' : 'bg-[#151515] border-white/5'}`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg tracking-wide uppercase">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-6 pt-4">
                  <h3 className={`text-2xl font-bold mb-6 ${plan.popular ? 'text-white' : 'text-white'}`}>{plan.name}</h3>

                  <div className="mb-3">
                    <span className={`text-5xl font-bold ${plan.popular ? 'text-orange-500' : 'text-white'}`}>₹{plan.price}</span>
                  </div>

                  <div>
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-orange-400' : 'text-purple-400'}`}>{plan.credits}</span>
                    <p className="text-gray-400 text-sm mt-1">Credits</p>
                  </div>
                </div>

                <ul className="space-y-3 mb-6 flex-grow mt-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
                      <svg className={`w-4 h-4 mt-1 ${plan.popular ? 'text-orange-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12.5l4 4L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleBuy(plan, index)}
                  className={`w-full py-6 rounded-2xl font-semibold tracking-wide transition-all duration-300 ${plan.popular ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg border-0' : 'bg-[#0a0a0a] border border-white/10 text-gray-300 hover:border-orange-500/30 hover:text-white hover:bg-[#1a1a1a]'}`}
                  disabled={isProcessing}
                >
                  {isProcessing && index === selectedIndex ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" /> Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4 inline-block" /> {plan.cta}
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
