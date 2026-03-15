import { useMemo, useEffect, useState } from "react";
import { formatLongDateIST } from "@/lib/dateUtils";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, User, Share2, ExternalLink } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { blogPosts, getRelatedPosts, categoryIcons } from "@/lib/blogData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);
  const related = useMemo(() => post ? getRelatedPosts(post.slug) : [], [post]);
  const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);

  usePageMeta({
    title: post?.metaTitle || "Blog | SkillMitra",
    description: post?.metaDescription || "",
    ogType: "article",
    jsonLd: post ? {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      url: `https://skillmitra.online/blog/${post.slug}`,
      datePublished: post.date,
      author: { "@type": "Person", name: post.author },
      publisher: { "@type": "Organization", name: "SkillMitra", logo: { "@type": "ImageObject", url: "https://skillmitra.online/icons/icon-512x512.png" } },
      mainEntityOfPage: { "@type": "WebPage", "@id": `https://skillmitra.online/blog/${post.slug}` },
    } : undefined,
  });

  // Parse TOC from content
  useEffect(() => {
    if (!post) return;
    const headings: { id: string; text: string; level: number }[] = [];
    post.content.split("\n").forEach(line => {
      const m3 = line.match(/^### (.+)/);
      const m2 = line.match(/^## (.+)/);
      if (m2) {
        const text = m2[1];
        headings.push({ id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"), text, level: 2 });
      } else if (m3) {
        const text = m3[1];
        headings.push({ id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"), text, level: 3 });
      }
    });
    setToc(headings);
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-bold text-foreground">Article not found</h1>
          <Link to="/blog" className="text-primary mt-4 inline-block">← Back to Blog</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (d: string) => formatLongDateIST(d);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = post.title;

  // Render markdown-ish content to JSX
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let tableRows: string[][] = [];
    let inTable = false;
    let tableKey = 0;

    const flushTable = () => {
      if (tableRows.length > 1) {
        const header = tableRows[0];
        const body = tableRows.slice(1).filter(r => !r.every(c => c.match(/^[-|:\s]+$/)));
        elements.push(
          <div key={`table-${tableKey++}`} className="overflow-x-auto my-6">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead><tr className="bg-muted">{header.map((h, i) => <th key={i} className="px-4 py-2 text-left font-semibold text-foreground">{h}</th>)}</tr></thead>
              <tbody>{body.map((row, ri) => <tr key={ri} className="border-t border-border">{row.map((c, ci) => <td key={ci} className="px-4 py-2 text-muted-foreground">{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    };

    lines.forEach((line, i) => {
      // Table
      if (line.startsWith("|")) {
        inTable = true;
        const cells = line.split("|").filter(c => c.trim()).map(c => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable();
      }

      if (line.startsWith("### ")) {
        const text = line.slice(4);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        elements.push(<h3 key={i} id={id} className="text-xl font-bold text-foreground mt-8 mb-3">{text}</h3>);
      } else if (line.startsWith("## ")) {
        const text = line.slice(3);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        elements.push(<h2 key={i} id={id} className="text-2xl font-extrabold text-foreground mt-10 mb-4">{text}</h2>);
      } else if (line.startsWith("> ")) {
        elements.push(<blockquote key={i} className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-r-lg pr-4">{line.slice(2)}</blockquote>);
      } else if (line.startsWith("- **")) {
        const m = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
        if (m) elements.push(<li key={i} className="ml-4 mb-2 text-muted-foreground list-disc"><strong className="text-foreground">{m[1]}</strong>{m[2] ? `: ${m[2]}` : ""}</li>);
      } else if (line.match(/^\d+\. /)) {
        const text = line.replace(/^\d+\.\s/, "");
        const rendered = text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        elements.push(<li key={i} className="ml-4 mb-2 text-muted-foreground list-disc" dangerouslySetInnerHTML={{ __html: rendered }} />);
      } else if (line.startsWith("- ")) {
        const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        elements.push(<li key={i} className="ml-4 mb-2 text-muted-foreground list-disc" dangerouslySetInnerHTML={{ __html: text }} />);
      } else if (line.trim() === "") {
        // skip
      } else {
        const rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        elements.push(<p key={i} className="text-muted-foreground leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: rendered }} />);
      }
    });

    if (inTable) flushTable();
    return elements;
  };

  const CatIcon = categoryIcons[post.category] || Share2;
  const contentLines = post.content.split("\n");
  const midPoint = Math.floor(contentLines.length / 2);
  const firstHalf = contentLines.slice(0, midPoint).join("\n");
  const secondHalf = contentLines.slice(midPoint).join("\n");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back */}
            <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Blog
            </Link>

            {/* Header */}
            <Badge className="mb-3 bg-primary/10 text-primary border-0">{post.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-4 h-4" />{post.author}</span>
              <span>{formatDate(post.date)}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.readTime}</span>
            </div>

            {/* Share */}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs text-muted-foreground">Share:</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-green-600 text-xs font-medium">WhatsApp</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-blue-600 text-xs font-medium">LinkedIn</a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="text-muted-foreground hover:text-sky-500 text-xs font-medium">Twitter</a>
            </div>

            <hr className="my-8 border-border" />

            <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-8">
              {/* Article */}
              <article className="prose-custom text-justify">
                {renderContent(firstHalf)}

                {/* CTA Box */}
                <div className="my-8 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <h3 className="text-lg font-bold text-foreground mb-2">🎯 Find Your Trainer on SkillMitra</h3>
                  <p className="text-sm text-muted-foreground mb-4">Learn from verified industry experts with personal 1:1 training. Book a free trial session today!</p>
                  <Link to="/browse">
                    <Button className="bg-primary text-primary-foreground font-semibold">Browse Trainers <ExternalLink className="ml-2 w-4 h-4" /></Button>
                  </Link>
                </div>

                {renderContent(secondHalf)}
              </article>

              {/* TOC Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Table of Contents</h4>
                  <nav className="space-y-1.5">
                    {toc.map((h, i) => (
                      <a key={i} href={`#${h.id}`}
                        className={`block text-xs text-muted-foreground hover:text-primary transition-colors ${h.level === 3 ? "pl-3" : ""}`}>
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            </div>

            {/* Author Box */}
            <div className="mt-12 p-6 rounded-xl border border-border bg-muted/30 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary">SM</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">SkillMitra Team</p>
                <p className="text-sm text-muted-foreground">Our team of educators and industry experts create content to help you learn, grow, and succeed in your career.</p>
              </div>
            </div>

            {/* Related Articles */}
            {related.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-extrabold text-foreground mb-6">Related Articles</h2>
                <div className="grid sm:grid-cols-3 gap-5">
                  {related.map(rp => {
                    const RIcon = categoryIcons[rp.category] || Share2;
                    return (
                      <Link key={rp.slug} to={`/blog/${rp.slug}`} className="group">
                        <div className="rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-[16/9] bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
                            <RIcon className="w-8 h-8 text-primary-foreground/60" />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{rp.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{rp.readTime}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPost;
