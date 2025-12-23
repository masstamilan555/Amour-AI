import { Button } from "@/components/ui/button";
import { plans } from "@/data/plans";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ./components/PricingSection.js (or .tsx)


const PricingSection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-[#0a0a0a] relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent pb-2">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Select the perfect toolkit to accelerate your dating success and find meaningful connections faster.
          </p>
        </div>
        
        {/* Pricing Cards - 4 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`
                relative flex flex-col rounded-3xl border transition-all duration-300
                ${plan.popular 
                  ? 'bg-[#1a1a1a] border-2 border-orange-500 shadow-[0_0_50px_-10px_rgba(234,88,12,0.3)] scale-105' 
                  : 'bg-[#151515] border-white/5 hover:border-white/10 hover:-translate-y-2'
                }
                p-8
              `}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg tracking-wide uppercase">
                    Most Popular
                  </div>
                </div>
              )}
              
              {/* Plan Name */}
              <div className="text-center mb-6 pt-2">
                <h3 className="text-2xl font-bold text-white mb-6">
                  {plan.name}
                </h3>
                
                {/* Price */}
                <div className="mb-4">
                  <span className={`text-5xl font-bold ${plan.popular ? 'text-orange-500' : 'text-white'}`}>
                    {plan.price}
                  </span>
                </div>

                {/* Credits */}
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-orange-400' : 'text-purple-400'}`}>
                    {plan.credits}
                  </span>
                  <p className="text-gray-400 text-sm mt-1">Credits</p>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 ${plan.popular ? 'text-orange-500' : 'text-gray-400'}`} />
                    <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {/* CTA Button */}
              <Button 
                onClick={() => { navigate('/buy-credits'); }} 
                className={`w-full py-6 rounded-2xl font-semibold tracking-wide transition-all duration-300
                  ${plan.popular 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/20 border-0' 
                    : 'bg-[#0a0a0a] border border-white/10 hover:border-orange-500/30 text-gray-300 hover:text-white hover:bg-[#1a1a1a]'
                  }
                `}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
