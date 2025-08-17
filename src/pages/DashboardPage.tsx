/**
 * SIMPLIFIED DASHBOARD PAGE
 * 
 * Clean dashboard using our new simplified architecture.
 * Uses direct hooks, no complex prop passing or event bus.
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Archive,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';

import { useLetters } from '../hooks/useLetters';
import type { Letter } from '../lib/types';
import { LetterCard } from '../components/LetterCard';

export function DashboardPage() {
  const navigate = useNavigate();
  const { letters, isLoading: lettersLoading } = useLetters();

  // Calculate stats from letters
  const stats = {
    total: letters.length,
    scheduled: letters.filter(l => l.status === 'scheduled').length,
    completed: letters.filter(l => l.status === 'sent').length,
    overallProgress: (() => {
      const totalMilestones = letters.reduce((sum, letter) => 
        sum + (letter.milestones?.length || 0), 0);
      const completedMilestones = letters.reduce((sum, letter) => 
        sum + (letter.milestones?.filter(m => m.completed).length || 0), 0);
      return totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    })()
  };

  // Get recent letters (top 3)
  const recentLetters = letters.slice(0, 3);

  const handleCreateClick = () => {
    navigate('/letters');
    // After navigation, we could trigger the create form
    setTimeout(() => {
      // In a real app, we might use a query parameter or state
      // For now, user can click the "New Letter" button on the letters page
    }, 100);
  };

  const handleViewAllLetters = () => {
    navigate('/letters');
  };

  const handleViewLetter = (letter: Letter) => {
    navigate('/letters');
    // In the future, we could pass the letter ID as a query param
  };

  return (
    <>
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Track your progress and manage your future letters
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Total Letters
                  </p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Archive className="h-5 w-5 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Scheduled
                  </p>
                  <p className="text-2xl font-bold">{stats.scheduled}</p>
                </div>
                <Clock className="h-5 w-5 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Delivered
                  </p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Progress
                  </p>
                  <p className="text-2xl font-bold">{stats.overallProgress}%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary opacity-50" />
              </div>
              {stats.overallProgress > 0 && (
                <Progress value={stats.overallProgress} className="mt-3 h-2" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={handleCreateClick}>
            <CardContent className="p-6 text-center space-y-3">
              <Plus className="h-10 w-10 text-primary mx-auto group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-semibold text-lg">Write New Letter</h3>
                <p className="text-sm text-muted-foreground">
                  Create a new letter to your future self
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer group" onClick={handleViewAllLetters}>
            <CardContent className="p-6 text-center space-y-3">
              <Archive className="h-10 w-10 text-primary mx-auto group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-semibold text-lg">View All Letters</h3>
                <p className="text-sm text-muted-foreground">
                  Browse and manage your letter collection
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Letters */}
        {recentLetters.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Letters</h2>
              <Button variant="ghost" onClick={handleViewAllLetters}>
                View all
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentLetters.map((letter) => (
                <LetterCard
                  key={letter.id}
                  letter={letter}
                  onView={handleViewLetter}
                  onEdit={handleViewLetter}
                  onDelete={() => {}}
                  onStatusChange={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {letters.length === 0 && !lettersLoading && (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <div className="space-y-2 mb-6">
              <h3 className="text-xl font-semibold">Welcome to Future Letter Coach!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start your journey by writing your first letter to your future self. 
                Set goals, track progress, and receive motivation when you need it most.
              </p>
            </div>
            <Button onClick={handleCreateClick} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Write Your First Letter
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
