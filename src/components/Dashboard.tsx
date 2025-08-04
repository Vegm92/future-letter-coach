import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Archive, 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Plus,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardProps } from "@/types";

const Dashboard = ({ onCreateClick, onViewAllLetters, onViewLetter }: DashboardProps) => {
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    overallProgress: 0
  });
  const [recentLetters, setRecentLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: lettersData, error: lettersError } = await supabase
        .from('letters')
        .select(`
          *,
          milestones (
            id,
            title,
            percentage,
            completed,
            target_date
          )
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (lettersError) throw lettersError;

      setRecentLetters(lettersData || []);
      
      // Calculate stats
      const total = lettersData?.length || 0;
      const scheduled = lettersData?.filter(l => l.status === 'scheduled').length || 0;
      const completed = lettersData?.filter(l => l.status === 'sent').length || 0;
      
      // Calculate overall progress across all letters
      let totalMilestones = 0;
      let completedMilestones = 0;
      
      lettersData?.forEach(letter => {
        if (letter.milestones) {
          totalMilestones += letter.milestones.length;
          completedMilestones += letter.milestones.filter((m: any) => m.completed).length;
        }
      });
      
      const overallProgress = totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

      setStats({ total, scheduled, completed, overallProgress });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Failed to load dashboard",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your progress and manage your future letters
        </p>
      </div>

      {/* Compact Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-card border rounded-md p-3 hover-scale">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <Archive className="h-3.5 w-3.5 text-primary opacity-50" />
          </div>
        </div>
        
        <div className="bg-card border rounded-md p-3 hover-scale">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Scheduled</p>
              <p className="text-lg font-bold">{stats.scheduled}</p>
            </div>
            <Clock className="h-3.5 w-3.5 text-warning opacity-50" />
          </div>
        </div>
        
        <div className="bg-card border rounded-md p-3 hover-scale">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Delivered</p>
              <p className="text-lg font-bold">{stats.completed}</p>
            </div>
            <CheckCircle className="h-3.5 w-3.5 text-success opacity-50" />
          </div>
        </div>
        
        <div className="bg-card border rounded-md p-3 hover-scale">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Progress</p>
              <p className="text-lg font-bold">{stats.overallProgress}%</p>
            </div>
            <TrendingUp className="h-3.5 w-3.5 text-primary opacity-50" />
          </div>
          {stats.overallProgress > 0 && (
            <Progress value={stats.overallProgress} className="mt-1.5 h-1" />
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - Smaller */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Target className="h-4 w-4" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={onCreateClick} className="w-full" variant="hero" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Letter
            </Button>
            <Button onClick={onViewAllLetters} variant="outline" className="w-full" size="sm">
              <Archive className="h-4 w-4 mr-2" />
              View All
              <ArrowRight className="h-3 w-3 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Letters - Larger */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Calendar className="h-4 w-4" />
              <span>Recent Letters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLetters.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No letters yet</p>
                <p className="text-xs">Create your first letter to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLetters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => onViewLetter(letter)}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{letter.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(letter.send_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          letter.status === 'sent'
                            ? 'bg-success/10 text-success'
                            : letter.status === 'scheduled'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {letter.status === 'sent' ? 'Delivered' : 
                         letter.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;