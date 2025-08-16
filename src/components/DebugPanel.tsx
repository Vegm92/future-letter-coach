import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from "lucide-react";
import { 
  getApiLogs, 
  clearApiLogs, 
  exportApiLogs,
  type LogEntry 
} from "@/shared/utils/api.utils";

const DebugPanel = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogEntry['level'] | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = () => {
    const allLogs = getApiLogs();
    setLogs(allLogs);
  };

  useEffect(() => {
    fetchLogs();
    
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredLogs = selectedLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === selectedLevel);

  const logStats = {
    total: logs.length,
    info: logs.filter(log => log.level === 'info').length,
    warn: logs.filter(log => log.level === 'warn').length,
    error: logs.filter(log => log.level === 'error').length,
    debug: logs.filter(log => log.level === 'debug').length,
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'debug': return <Activity className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getLevelBadgeVariant = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'default';
      case 'warn': return 'secondary';
      case 'error': return 'destructive';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    return `${duration}ms`;
  };

  const handleExport = () => {
    const dataStr = exportApiLogs();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    clearApiLogs();
    fetchLogs();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Debug Panel</h1>
          <p className="text-sm text-muted-foreground">
            Monitor API calls, retries, and system logs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                <p className="text-lg font-bold">{logStats.total}</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Info</p>
                <p className="text-lg font-bold text-blue-600">{logStats.info}</p>
              </div>
              <Info className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Warnings</p>
                <p className="text-lg font-bold text-yellow-600">{logStats.warn}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Errors</p>
                <p className="text-lg font-bold text-red-600">{logStats.error}</p>
              </div>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Debug</p>
                <p className="text-lg font-bold text-gray-600">{logStats.debug}</p>
              </div>
              <Activity className="h-4 w-4 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>API Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger 
                value="all" 
                onClick={() => setSelectedLevel('all')}
                className="flex items-center gap-2"
              >
                All ({logStats.total})
              </TabsTrigger>
              <TabsTrigger 
                value="info" 
                onClick={() => setSelectedLevel('info')}
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Info ({logStats.info})
              </TabsTrigger>
              <TabsTrigger 
                value="warn" 
                onClick={() => setSelectedLevel('warn')}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Warn ({logStats.warn})
              </TabsTrigger>
              <TabsTrigger 
                value="error" 
                onClick={() => setSelectedLevel('error')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Error ({logStats.error})
              </TabsTrigger>
              <TabsTrigger 
                value="debug" 
                onClick={() => setSelectedLevel('debug')}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                Debug ({logStats.debug})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <LogsView logs={filteredLogs} />
            </TabsContent>
            <TabsContent value="info" className="mt-4">
              <LogsView logs={filteredLogs} />
            </TabsContent>
            <TabsContent value="warn" className="mt-4">
              <LogsView logs={filteredLogs} />
            </TabsContent>
            <TabsContent value="error" className="mt-4">
              <LogsView logs={filteredLogs} />
            </TabsContent>
            <TabsContent value="debug" className="mt-4">
              <LogsView logs={filteredLogs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const LogsView = ({ logs }: { logs: LogEntry[] }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No logs found for the selected level</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 w-full">
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div
            key={`${log.timestamp}-${index}`}
            className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-shrink-0 mt-1">
              {getLevelIcon(log.level)}
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={getLevelBadgeVariant(log.level)}>
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">{log.message}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {log.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(log.duration)}
                    </span>
                  )}
                  <span>{formatTimestamp(log.timestamp)}</span>
                </div>
              </div>
              
              {log.context && Object.keys(log.context).length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer hover:text-foreground">
                    Context ({Object.keys(log.context).length} items)
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default DebugPanel;
