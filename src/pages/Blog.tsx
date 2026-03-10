import { useState, useMemo } from "react";
import { formatDateIST } from "@/lib/dateUtils";
import { Link } from "react-router-dom";
import { Search, Clock, User } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { blogPosts, blogCategories, categoryIcons } from "@/lib/blogData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Blog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  usePageMeta({
    title: "SkillMitra Blog — Career Tips, Learning Guides & Industry Insights",
    description: "Read expert articles on technology, career growth, learning strategies, and skill development. Free guides from India's top trainers.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "SkillMitra Blog",
      url: "https://skillmitra.online/blog",
      description: "Expert articles on technology, career growth, and skill development",
      publisher: { "@type": "Organization", name: "SkillMitra", url: "https://skillmitra.online", logo: { "@type": "ImageObject", url: "https://skillmitra.online/icons/icon-512x512.png" } },
    },
  });

  const filtered = useMemo(() => {
    return blogPosts.filter(p => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const formatDate = (d: string) => formatDateIST(d);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">SkillMitra Blog</h1>
            <p className="mt-2 text-muted-foreground max-w-lg mx-auto">Career tips, learning guides, and industry insights from India's top trainers.</p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {blogCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No articles found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(post => {
                const CatIcon = categoryIcons[post.category] || Search;
                return (
                  <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
                    <article className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      {/* Cover */}
                      <div className="aspect-[16/9] bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center relative">
                        <CatIcon className="w-12 h-12 text-primary-foreground/60" />
                        <Badge className="absolute top-3 left-3 bg-primary-foreground/20 text-primary-foreground border-0 text-xs backdrop-blur-sm">
                          {post.category}
                        </Badge>
                      </div>
                      <div className="p-5">
                        <h2 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                          <span>{formatDate(post.date)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
