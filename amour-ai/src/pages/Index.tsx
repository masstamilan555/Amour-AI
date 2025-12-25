import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PricingSection from "@/components/PricingSection";
import { CallToActionSection, Footer } from "@/components/CallToActionSection";
interface IndexProps {
  user: any;
  setUser: React.Dispatch<any>;
}
const Index: React.FC<IndexProps> = ({ user, setUser }) => {
  return (
    <div className="min-h-screen">
      <HeroSection user={user} />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CallToActionSection />
      <Footer />
    </div>
  );
};

export default Index;
