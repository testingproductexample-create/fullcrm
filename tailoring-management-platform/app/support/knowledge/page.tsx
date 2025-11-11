/**
 * Customer Service & Support Management - Knowledge Base
 * Comprehensive knowledge base management with articles, search, and analytics
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  useKnowledgeBaseArticles,
  useKnowledgeBaseArticle,
  useCreateKnowledgeBaseArticle,
  useRateKnowledgeBaseArticle,
  useTicketCategories
} from '@/hooks/useSupport';
import { 
  SearchIcon,
  PlusIcon,
  BookOpenIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  EyeIcon,
  EditIcon,
  FilterIcon,
  FileTextIcon,
  TrendingUpIcon,
  ClockIcon,
  TagIcon,
  StarIcon,
  CheckCircleIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// Article type configurations
const articleTypeConfig = {
  how_to: { label: 'How To', color: 'bg-blue-500', icon: FileTextIcon },
  troubleshooting: { label: 'Troubleshooting', color: 'bg-orange-500', icon: SearchIcon },
  faq: { label: 'FAQ', color: 'bg-green-500', icon: BookOpenIcon },
  policy: { label: 'Policy', color: 'bg-purple-500', icon: CheckCircleIcon },
  tutorial: { label: 'Tutorial', color: 'bg-yellow-500', icon: StarIcon },
  reference: { label: 'Reference', color: 'bg-gray-500', icon: BookOpenIcon },
};

export default function KnowledgeBase() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Data fetching
  const { data: articles = [], isLoading: articlesLoading, refetch } = useKnowledgeBaseArticles(search, selectedCategory);
  const { data: categories = [] } = useTicketCategories();

  // Mutations
  const createArticle = useCreateKnowledgeBaseArticle();
  const rateArticle = useRateKnowledgeBaseArticle();

  // Filter articles by type
  const filteredArticles = selectedType 
    ? articles.filter(article => article.article_type === selectedType)
    : articles;

  // Calculate statistics
  const stats = {
    totalArticles: articles.length,
    publishedArticles: articles.filter(a => a.is_published).length,
    totalViews: articles.reduce((sum, a) => sum + (a.view_count || 0), 0),
    avgHelpfulRate: articles.length > 0 
      ? (articles.reduce((sum, a) => {
          const total = (a.helpful_count || 0) + (a.not_helpful_count || 0);
          return sum + (total > 0 ? (a.helpful_count || 0) / total : 0);
        }, 0) / articles.length * 100)
      : 0
  };

  // Handle article rating
  const handleRateArticle = async (articleId: string, helpful: boolean) => {
    try {
      await rateArticle.mutateAsync({ articleId, helpful });
      toast.success(helpful ? 'Marked as helpful' : 'Feedback recorded');
      refetch();
    } catch (error) {
      toast.error('Failed to record feedback');
    }
  };

  return (
    <div className=\"p-6 space-y-6\">
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent\">
            Knowledge Base
          </h1>
          <p className=\"text-muted-foreground mt-2\">
            Create, manage, and maintain support documentation and articles
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className=\"bg-blue-600 hover:bg-blue-700\">
              <PlusIcon className=\"w-4 h-4 mr-2\" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent className=\"max-w-2xl max-h-[80vh] overflow-y-auto\">
            <DialogHeader>
              <DialogTitle>Create Knowledge Base Article</DialogTitle>
              <DialogDescription>
                Create a new article to help customers and support agents
              </DialogDescription>
            </DialogHeader>
            <CreateArticleForm 
              categories={categories}
              onSubmit={async (data) => {
                try {
                  await createArticle.mutateAsync(data);
                  toast.success('Article created successfully');
                  setIsCreateDialogOpen(false);
                  refetch();
                } catch (error) {
                  toast.error('Failed to create article');
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-muted-foreground\">Total Articles</p>
                <p className=\"text-2xl font-bold\">{stats.totalArticles}</p>
                <p className=\"text-xs text-muted-foreground mt-1\">
                  {stats.publishedArticles} published
                </p>
              </div>
              <div className=\"h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center\">
                <BookOpenIcon className=\"h-6 w-6 text-blue-600\" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-muted-foreground\">Total Views</p>
                <p className=\"text-2xl font-bold\">{stats.totalViews.toLocaleString()}</p>
                <p className=\"text-xs text-muted-foreground mt-1\">
                  All time
                </p>
              </div>
              <div className=\"h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center\">
                <EyeIcon className=\"h-6 w-6 text-green-600\" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-muted-foreground\">Helpful Rate</p>
                <p className=\"text-2xl font-bold\">{stats.avgHelpfulRate.toFixed(1)}%</p>
                <p className=\"text-xs text-muted-foreground mt-1\">
                  Average rating
                </p>
              </div>
              <div className=\"h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center\">
                <ThumbsUpIcon className=\"h-6 w-6 text-yellow-600\" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center justify-between\">
              <div>
                <p className=\"text-sm font-medium text-muted-foreground\">Categories</p>
                <p className=\"text-2xl font-bold\">{categories.length}</p>
                <p className=\"text-xs text-muted-foreground mt-1\">
                  Available
                </p>
              </div>
              <div className=\"h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center\">
                <TagIcon className=\"h-6 w-6 text-purple-600\" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue=\"articles\" className=\"space-y-6\">
        <TabsList className=\"grid w-full grid-cols-3\">
          <TabsTrigger value=\"articles\">Articles</TabsTrigger>
          <TabsTrigger value=\"popular\">Most Popular</TabsTrigger>
          <TabsTrigger value=\"recent\">Recent</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
          <CardContent className=\"p-6\">
            <div className=\"flex items-center gap-4 flex-wrap\">
              <div className=\"relative min-w-64 flex-1\">
                <SearchIcon className=\"absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground\" />
                <Input
                  placeholder=\"Search articles, topics, keywords...\"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className=\"pl-10\"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className=\"w-48\">
                  <SelectValue placeholder=\"All Categories\" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"\">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className=\"w-40\">
                  <SelectValue placeholder=\"All Types\" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"\">All Types</SelectItem>
                  {Object.entries(articleTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <TabsContent value=\"articles\">
          <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
            <CardHeader>
              <CardTitle>Knowledge Base Articles ({filteredArticles.length})</CardTitle>
              <CardDescription>
                Browse and manage support documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {articlesLoading ? (
                <div className=\"text-center py-12\">
                  <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto\"></div>
                  <p className=\"mt-4 text-muted-foreground\">Loading articles...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className=\"text-center py-12\">
                  <BookOpenIcon className=\"mx-auto h-12 w-12 text-muted-foreground\" />
                  <p className=\"mt-4 text-muted-foreground\">No articles found</p>
                  <p className=\"text-sm text-muted-foreground\">Try adjusting your search or create a new article</p>
                </div>
              ) : (
                <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
                  {filteredArticles.map((article) => {
                    const typeConfig = articleTypeConfig[article.article_type as keyof typeof articleTypeConfig];
                    const helpfulRate = ((article.helpful_count || 0) + (article.not_helpful_count || 0)) > 0
                      ? (article.helpful_count || 0) / ((article.helpful_count || 0) + (article.not_helpful_count || 0)) * 100
                      : 0;

                    return (
                      <Card key={article.id} className=\"hover:shadow-lg transition-shadow bg-white/50 border border-white/20\">
                        <CardContent className=\"p-6\">
                          <div className=\"space-y-4\">
                            <div className=\"flex items-start justify-between\">
                              <div className=\"flex-1\">
                                <div className=\"flex items-center gap-2 mb-2\">
                                  <Badge className={`${typeConfig.color} text-white`}>
                                    {typeConfig.label}
                                  </Badge>
                                  {article.is_featured && (
                                    <Badge variant=\"outline\" className=\"border-yellow-300 text-yellow-700\">
                                      <StarIcon className=\"w-3 h-3 mr-1\" />
                                      Featured
                                    </Badge>
                                  )}
                                  {!article.is_published && (
                                    <Badge variant=\"secondary\">Draft</Badge>
                                  )}
                                </div>
                                <h3 className=\"font-semibold text-lg mb-2 line-clamp-2\">
                                  {article.article_title}
                                </h3>
                                <p className=\"text-sm text-muted-foreground line-clamp-3 mb-3\">
                                  {article.article_summary || article.article_content?.substring(0, 150) + '...'}
                                </p>
                              </div>
                            </div>

                            <div className=\"flex items-center justify-between text-sm text-muted-foreground\">
                              <div className=\"flex items-center gap-4\">
                                <span className=\"flex items-center gap-1\">
                                  <EyeIcon className=\"w-4 h-4\" />
                                  {article.view_count || 0}
                                </span>
                                <span className=\"flex items-center gap-1\">
                                  <ThumbsUpIcon className=\"w-4 h-4\" />
                                  {helpfulRate.toFixed(0)}%
                                </span>
                                <span className=\"flex items-center gap-1\">
                                  <ClockIcon className=\"w-4 h-4\" />
                                  {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div className=\"text-xs\">
                                v{article.version_number}
                              </div>
                            </div>

                            <div className=\"flex items-center justify-between pt-4 border-t\">
                              <div className=\"flex items-center gap-2\">
                                <Button 
                                  variant=\"outline\" 
                                  size=\"sm\"
                                  onClick={() => handleRateArticle(article.id, true)}
                                >
                                  <ThumbsUpIcon className=\"w-4 h-4 mr-1\" />
                                  {article.helpful_count || 0}
                                </Button>
                                <Button 
                                  variant=\"outline\" 
                                  size=\"sm\"
                                  onClick={() => handleRateArticle(article.id, false)}
                                >
                                  <ThumbsDownIcon className=\"w-4 h-4 mr-1\" />
                                  {article.not_helpful_count || 0}
                                </Button>
                              </div>
                              <div className=\"flex items-center gap-2\">
                                <Link href={`/support/knowledge/${article.id}`}>
                                  <Button variant=\"outline\" size=\"sm\">
                                    <EyeIcon className=\"w-4 h-4 mr-1\" />
                                    View
                                  </Button>
                                </Link>
                                <Button variant=\"outline\" size=\"sm\">
                                  <EditIcon className=\"w-4 h-4 mr-1\" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Most Popular Articles */}
        <TabsContent value=\"popular\">
          <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
            <CardHeader>
              <CardTitle>Most Popular Articles</CardTitle>
              <CardDescription>
                Articles with the highest view counts and ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                {filteredArticles
                  .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                  .slice(0, 10)
                  .map((article, index) => {
                    const typeConfig = articleTypeConfig[article.article_type as keyof typeof articleTypeConfig];
                    const helpfulRate = ((article.helpful_count || 0) + (article.not_helpful_count || 0)) > 0
                      ? (article.helpful_count || 0) / ((article.helpful_count || 0) + (article.not_helpful_count || 0)) * 100
                      : 0;

                    return (
                      <div key={article.id} className=\"flex items-center justify-between p-4 bg-white/30 rounded-lg border border-white/20\">
                        <div className=\"flex items-center gap-4\">
                          <div className=\"text-2xl font-bold text-muted-foreground w-8\">
                            {index + 1}
                          </div>
                          <div>
                            <div className=\"flex items-center gap-2 mb-1\">
                              <Badge className={`${typeConfig.color} text-white text-xs`}>
                                {typeConfig.label}
                              </Badge>
                              {article.is_featured && (
                                <StarIcon className=\"w-4 h-4 text-yellow-500\" />
                              )}
                            </div>
                            <h3 className=\"font-medium\">{article.article_title}</h3>
                            <p className=\"text-sm text-muted-foreground\">
                              {article.category?.category_name || 'Uncategorized'}
                            </p>
                          </div>
                        </div>
                        <div className=\"flex items-center gap-6 text-sm\">
                          <div className=\"text-center\">
                            <div className=\"font-semibold\">{article.view_count || 0}</div>
                            <div className=\"text-muted-foreground\">Views</div>
                          </div>
                          <div className=\"text-center\">
                            <div className=\"font-semibold\">{helpfulRate.toFixed(0)}%</div>
                            <div className=\"text-muted-foreground\">Helpful</div>
                          </div>
                          <Link href={`/support/knowledge/${article.id}`}>
                            <Button variant=\"outline\" size=\"sm\">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Articles */}
        <TabsContent value=\"recent\">
          <Card className=\"backdrop-blur-sm bg-white/60 border border-white/20\">
            <CardHeader>
              <CardTitle>Recent Articles</CardTitle>
              <CardDescription>
                Recently created and updated articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-4\">
                {filteredArticles
                  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                  .slice(0, 10)
                  .map((article) => {
                    const typeConfig = articleTypeConfig[article.article_type as keyof typeof articleTypeConfig];

                    return (
                      <div key={article.id} className=\"flex items-center justify-between p-4 bg-white/30 rounded-lg border border-white/20\">
                        <div className=\"flex items-center gap-4\">
                          <div className={`w-12 h-12 ${typeConfig.color} rounded-lg flex items-center justify-center`}>
                            <typeConfig.icon className=\"w-6 h-6 text-white\" />
                          </div>
                          <div>
                            <div className=\"flex items-center gap-2 mb-1\">
                              <h3 className=\"font-medium\">{article.article_title}</h3>
                              {!article.is_published && (
                                <Badge variant=\"secondary\">Draft</Badge>
                              )}
                            </div>
                            <p className=\"text-sm text-muted-foreground\">
                              {article.category?.category_name || 'Uncategorized'} • 
                              Updated {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className=\"flex items-center gap-2\">
                          <span className=\"text-sm text-muted-foreground\">
                            v{article.version_number}
                          </span>
                          <Link href={`/support/knowledge/${article.id}`}>
                            <Button variant=\"outline\" size=\"sm\">
                              <EyeIcon className=\"w-4 h-4 mr-1\" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Create Article Form Component
interface CreateArticleFormProps {
  categories: any[];
  onSubmit: (data: any) => void;
}

function CreateArticleForm({ categories, onSubmit }: CreateArticleFormProps) {
  const [formData, setFormData] = useState({
    article_title: '',
    article_content: '',
    article_summary: '',
    article_type: 'how_to',
    category_id: '',
    meta_description: '',
    search_tags: '',
    is_published: false,
    is_public: true,
    is_featured: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const slug = formData.article_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    onSubmit({
      ...formData,
      article_slug: slug,
      search_tags: formData.search_tags ? formData.search_tags.split(',').map(t => t.trim()) : [],
      author_id: 'current-user-id', // Replace with actual current user ID
      author_name: 'Current User', // Replace with actual current user name
    });
  };

  return (
    <form onSubmit={handleSubmit} className=\"space-y-6\">
      <div className=\"space-y-2\">
        <Label htmlFor=\"article_title\">Article Title</Label>
        <Input
          id=\"article_title\"
          value={formData.article_title}
          onChange={(e) => setFormData(prev => ({ ...prev, article_title: e.target.value }))}
          placeholder=\"Enter article title...\"
          required
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"article_summary\">Summary</Label>
        <Textarea
          id=\"article_summary\"
          value={formData.article_summary}
          onChange={(e) => setFormData(prev => ({ ...prev, article_summary: e.target.value }))}
          placeholder=\"Brief summary of the article...\"
          rows={2}
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"article_content\">Content</Label>
        <Textarea
          id=\"article_content\"
          value={formData.article_content}
          onChange={(e) => setFormData(prev => ({ ...prev, article_content: e.target.value }))}
          placeholder=\"Write your article content...\"
          rows={8}
          required
        />
      </div>

      <div className=\"grid grid-cols-2 gap-4\">
        <div className=\"space-y-2\">
          <Label htmlFor=\"article_type\">Type</Label>
          <Select value={formData.article_type} onValueChange={(value) => setFormData(prev => ({ ...prev, article_type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(articleTypeConfig).map(([type, config]) => (
                <SelectItem key={type} value={type}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className=\"space-y-2\">
          <Label htmlFor=\"category_id\">Category</Label>
          <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder=\"Select category\" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.category_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"search_tags\">Tags (comma separated)</Label>
        <Input
          id=\"search_tags\"
          value={formData.search_tags}
          onChange={(e) => setFormData(prev => ({ ...prev, search_tags: e.target.value }))}
          placeholder=\"tag1, tag2, tag3...\"
        />
      </div>

      <div className=\"space-y-2\">
        <Label htmlFor=\"meta_description\">Meta Description</Label>
        <Textarea
          id=\"meta_description\"
          value={formData.meta_description}
          onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
          placeholder=\"SEO meta description...\"
          rows={2}
        />
      </div>

      <div className=\"flex items-center gap-6\">
        <div className=\"flex items-center space-x-2\">
          <input
            type=\"checkbox\"
            id=\"is_published\"
            checked={formData.is_published}
            onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
            className=\"rounded border-gray-300\"
          />
          <Label htmlFor=\"is_published\">Publish immediately</Label>
        </div>
        <div className=\"flex items-center space-x-2\">
          <input
            type=\"checkbox\"
            id=\"is_featured\"
            checked={formData.is_featured}
            onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
            className=\"rounded border-gray-300\"
          />
          <Label htmlFor=\"is_featured\">Featured article</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type=\"submit\">Create Article</Button>
      </DialogFooter>
    </form>
  );
}