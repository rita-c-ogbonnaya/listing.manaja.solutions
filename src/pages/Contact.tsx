import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Check, Loader2, Mail, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionWrapper } from "@/components/SectionWrapper";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Seo } from "@/components/Seo";

const contactDetails = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@manaja.solutions",
    href: "mailto:hello@manaja.solutions",
  },
  {
    icon: Phone,
    label: "Phone",
    value: [
      { text: "+234 (814) 694-6985", link: "tel:+2348146946985" },
      { text: "+250 (793) 149-988", link: "tel:+250793149988" },
    ],
  },
  {
    icon: MapPin,
    label: "Address",
    value: "Global: Remote-First",
    href: null,
  },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Monday - Friday, 9AM - 5PM GMT+1",
    href: null,
  },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone") || undefined,
          subject: formData.get("subject"),
          message: formData.get("message"),
        },
      });
      if (error) throw error;
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title="Contact Manaja — Talk to Our Sales & Support Team"
        description="Get in touch with Manaja Solutions about HR, Payroll, CRM, Accounting, Inventory, Property, Projects, Compliance and Analytics — email, phone, or via our contact form."
        path="/contact"
        keywords="contact Manaja, Manaja sales, Manaja support, business software contact"
      />
    <SectionWrapper className="pt-32">
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-12 rounded-2xl border border-border bg-card"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Message Sent!
              </h3>
              <p className="text-muted-foreground mb-4">
                Thank you for reaching out. Our team will get back to you within
                24-48 hours.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsSubmitted(false)}
              >
                Send Another Message
              </Button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Get in{" "}
                <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                  Touch
                </span>
              </h1>
              <p className="text-muted-foreground mb-8">
                Have a question about our technology or want to collaborate?
                Fill out the form and we'll be in touch.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input name="firstName" placeholder="John" required className="bg-background" />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input name="lastName" placeholder="Doe" required className="bg-background" />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input name="email" type="email" placeholder="you@company.com" required className="bg-background" />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input name="phone" type="tel" placeholder="+1 (555) 000-0000" className="bg-background" />
                </div>

                <div>
                  <Label>Subject</Label>
                  <select name="subject" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>General Inquiry</option>
                    <option>Sales Question</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                    <option>Press / Media</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <Label>Message</Label>
                  <textarea
                    name="message"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Tell us how we can help..."
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full btn-glass-primary text-primary-foreground border-0 h-12 font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you accept our{" "}
                  <Link to="/terms-of-use" className="text-primary hover:underline">
                    terms of use
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    privacy policy
                  </Link>.
                </p>
              </form>
            </motion.div>
          )}
        </div>

        {/* CONTACT INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-2">
            Contact Information
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Prefer to reach out directly? Here are all the ways you can connect with us.
          </p>

          <div className="space-y-4 mb-8">
            {contactDetails.map((d) => (
              <div key={d.label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <d.icon className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">{d.label}</p>

                  {Array.isArray(d.value) ? (
                    <div className="flex gap-2 flex-wrap text-sm">
                      {d.value.map((item, index) => (
                        <span key={index}>
                          <a href={item.link} className="text-foreground hover:text-primary">
                            {item.text}
                          </a>
                          {index !== d.value.length - 1 && (
                            <span className="mx-2 text-muted-foreground">|</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : d.href ? (
                    <a href={d.href} className="text-sm text-foreground hover:text-primary">
                      {d.value}
                    </a>
                  ) : (
                    <p className="text-sm text-foreground">{d.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
    </>
  );
}