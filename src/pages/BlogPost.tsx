import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import DOMPurify from "dompurify";
import { SectionWrapper } from "@/components/SectionWrapper";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  body_html: string;
  author: string | null;
  published_at: string | null;
};

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        setPost(data as Post | null);
        setLoading(false);
        if (data) {
          document.title = `${(data as Post).title} | Manaja Blog`;
        }
      });
  }, [slug]);

  if (loading) {
    return <div className="pt-32 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline" /></div>;
  }
  if (!post) {
    return (
      <div className="pt-32 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
        <Link to="/blog" className="text-primary">Back to blog</Link>
      </div>
    );
  }

  const safeHtml = DOMPurify.sanitize(post.body_html);

  return (
    <div className="pt-20">
      <Seo
        title={`${post.title} | Manaja Blog`}
        description={post.excerpt ?? post.title}
        path={`/blog/${post.slug}`}
        image={post.cover_image_url ?? undefined}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt ?? undefined,
          image: post.cover_image_url ?? undefined,
          author: { "@type": "Person", name: post.author ?? "Manaja Team" },
          publisher: {
            "@type": "Organization",
            name: "Manaja Solutions",
            logo: { "@type": "ImageObject", url: "https://manaja.solutions/manajalogo.png" },
          },
          datePublished: post.published_at ?? undefined,
          mainEntityOfPage: `https://manaja.solutions/blog/${post.slug}`,
        }}
      />
      <SectionWrapper className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>
          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.title} className="w-full rounded-2xl mb-8 object-cover max-h-[420px]" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{post.title}</h1>
          <div className="text-sm text-muted-foreground mb-8">
            {post.author ?? "Manaja Team"}
            {post.published_at && <> · {new Date(post.published_at).toLocaleDateString()}</>}
          </div>
          <article
            className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        </div>
      </SectionWrapper>
    </div>
  );
}
