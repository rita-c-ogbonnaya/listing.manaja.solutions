import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";
import { SectionWrapper } from "@/components/SectionWrapper";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author: string | null;
  published_at: string | null;
};

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Blog | Manaja Solutions";
    supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,cover_image_url,author,published_at")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setPosts((data as Post[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="pt-20">
      <Seo
        title="Manaja Blog — Insights on ERP, HR, CRM, Finance & Business Automation"
        description="Articles and product news on HR & Payroll, CRM, Accounting & Finance, Inventory, Property Management, Projects, Compliance and Analytics — from the Manaja team."
        path="/blog"
        keywords="Manaja blog, ERP blog, HR software blog, CRM insights, business automation, SaaS blog"
      />
      <SectionWrapper className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-5">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Insights from Manaja</h1>
            <p className="text-lg text-muted-foreground">
              Stories, product news and ideas on collaborating, coding and scaling customer-centric technology.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline" /></div>
          ) : posts.length === 0 ? (
            <div className="max-w-xl mx-auto p-10 rounded-2xl border border-dashed border-border text-center bg-card">
              <h3 className="text-xl font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground">We're working on our first articles. Check back soon.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {posts.map((p, i) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <Link to={`/blog/${p.slug}`} className="block">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.title} className="w-full h-44 object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                    <div className="p-5">
                      <h2 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">{p.title}</h2>
                      {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{p.excerpt}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{p.author ?? "Manaja Team"}</span>
                        {p.published_at && <span>{new Date(p.published_at).toLocaleDateString()}</span>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm text-primary mt-4">
                        Read more <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </SectionWrapper>
    </div>
  );
}
