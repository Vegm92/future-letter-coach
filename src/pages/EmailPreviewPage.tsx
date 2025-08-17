/**
 * EMAIL PREVIEW PAGE - FOR DEVELOPMENT ONLY
 * 
 * Showcases email templates that users will receive
 * Allows developers to preview and test different email states
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail, Target, Clock, CheckCircle, AlertTriangle, Mic, MessageCircle, ExternalLink } from 'lucide-react';

// Sample letter data for email previews
const sampleLetters = [
  {
    id: '1',
    title: 'My 2024 Goals',
    content: 'Dear Future Me,\n\nI hope you\'re reading this having accomplished everything we set out to do this year. Remember how excited we were about learning React and building amazing apps? I hope you\'re now a skilled developer working on projects that matter.\n\nDon\'t forget to take care of your health and spend time with family. Success means nothing without the people we love.\n\nStay curious and keep growing!\n\nPast You',
    delivery_date: '2024-12-31T00:00:00Z',
    milestones: [
      { id: '1', text: 'Learn React and TypeScript', completed: true, due_date: '2024-06-01T00:00:00Z' },
      { id: '2', text: 'Build 3 full-stack projects', completed: false, due_date: '2024-09-01T00:00:00Z' },
      { id: '3', text: 'Get a developer job', completed: false, due_date: '2024-11-01T00:00:00Z' }
    ],
    personal_comments: 'This was written during a pivotal moment in my career transition.',
    created_at: '2024-01-01T00:00:00Z',
    status: 'scheduled',
    voice_note_url: 'https://example.com/voice-note-1.mp3',
    has_voice_note: true
  },
  {
    id: '2',
    title: 'Health & Wellness Journey',
    content: 'Future Me,\n\nBy now you should be in the best shape of your life! Remember the commitment we made to prioritize our health?\n\nI hope you\'ve been consistent with the gym, eating well, and getting enough sleep. Our body is our temple, and we need to treat it with respect.\n\nProud of you for making the change!',
    delivery_date: '2024-08-15T00:00:00Z',
    milestones: [
      { id: '1', text: 'Lose 20 pounds', completed: true, due_date: '2024-04-01T00:00:00Z' },
      { id: '2', text: 'Run a 5K under 25 minutes', completed: true, due_date: '2024-06-01T00:00:00Z' },
      { id: '3', text: 'Complete a half-marathon', completed: false, due_date: '2024-08-01T00:00:00Z' }
    ],
    personal_comments: 'Started this journey after a wake-up call from my doctor.',
    created_at: '2024-02-15T00:00:00Z',
    status: 'delivered',
    voice_note_url: 'https://example.com/voice-note-2.mp3',
    has_voice_note: true
  }
];

const emailTemplates = {
  letterDelivery: 'Letter Delivery',
  milestoneReminder: 'Milestone Reminder',
  welcomeEmail: 'Welcome Email',
  progressUpdate: 'Progress Update'
};

export function EmailPreviewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('letterDelivery');
  const [selectedLetter, setSelectedLetter] = useState(sampleLetters[0]);

  const renderEmailTemplate = () => {
    switch (selectedTemplate) {
      case 'letterDelivery':
        return renderLetterDeliveryEmail();
      case 'milestoneReminder':
        return renderMilestoneReminderEmail();
      case 'welcomeEmail':
        return renderWelcomeEmail();
      case 'progressUpdate':
        return renderProgressUpdateEmail();
      default:
        return renderLetterDeliveryEmail();
    }
  };

  const renderLetterDeliveryEmail = () => (
    <div className="bg-white text-black p-8 rounded-lg shadow-lg max-w-2xl mx-auto font-sans">
      {/* Email Header */}
      <div className="border-b pb-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Letter Coach</h1>
            <p className="text-sm text-gray-600">Your Future Letter Has Arrived!</p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">📬 Special Delivery from Your Past Self</h2>
          <p className="text-blue-700">
            The letter you wrote on {new Date(selectedLetter.created_at).toLocaleDateString()} is ready for you!
          </p>
        </div>
      </div>

      {/* Letter Content */}
      <div className="mb-8">
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">{selectedLetter.title}</h3>
          <p className="text-sm text-amber-700">
            Written on: {new Date(selectedLetter.created_at).toLocaleDateString()} • 
            Scheduled for: {new Date(selectedLetter.delivery_date).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {selectedLetter.content}
          </div>
        </div>
      </div>

      {/* Milestones Progress */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Your Progress Report</h3>
        <div className="space-y-3">
          {selectedLetter.milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {milestone.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-orange-500" />
              )}
              <span className={`flex-1 ${milestone.completed ? 'text-green-800 line-through' : 'text-gray-700'}`}>
                {milestone.text}
              </span>
              <span className="text-sm text-gray-500">
                Due: {new Date(milestone.due_date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Comments */}
      {selectedLetter.personal_comments && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">💭 Your Past Reflection</h3>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <p className="text-purple-800 italic">"{selectedLetter.personal_comments}"</p>
          </div>
        </div>
      )}

      {/* Voice Note */}
      {selectedLetter.has_voice_note && selectedLetter.voice_note_url && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🎤 Voice Message from Your Past Self</h3>
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-100 p-2 rounded-full">
                <Mic className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-indigo-900">Personal Voice Note</p>
                <p className="text-sm text-indigo-600">Recorded when you wrote this letter</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 cursor-pointer">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 h-2 rounded-full">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{width: '0%'}}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">0:00 / 2:34</p>
                </div>
                <ExternalLink className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Click to play your personal message in Letter Coach</p>
            </div>
          </div>
        </div>
      )}

      {/* Reply to Letter CTA */}
      <div className="mb-8">
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <MessageCircle className="h-6 w-6 text-emerald-600" />
            <h3 className="text-xl font-semibold text-emerald-900">Ready to Reply?</h3>
          </div>
          <p className="text-emerald-700 mb-4">Reflect on how far you've come and write a response to your past self</p>
          <div className="bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold inline-flex items-center gap-2 hover:bg-emerald-700 cursor-pointer">
            <MessageCircle className="h-4 w-4" />
            Reply to Your Letter →
          </div>
          <p className="text-xs text-emerald-600 mt-2">This will take you to your letter in Letter Coach</p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg text-center">
        <h3 className="text-xl font-semibold mb-2">Ready to Write Your Next Letter?</h3>
        <p className="mb-4 opacity-90">Continue your journey of self-reflection and growth</p>
        <div className="bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold inline-block">
          Open Letter Coach →
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
        <p>This letter was delivered by Letter Coach - Your Future Self Companion</p>
        <p className="mt-2">
          <span className="text-blue-600">Update Preferences</span> • 
          <span className="text-blue-600 ml-2">Unsubscribe</span>
        </p>
      </div>
    </div>
  );

  const renderMilestoneReminderEmail = () => (
    <div className="bg-white text-black p-8 rounded-lg shadow-lg max-w-2xl mx-auto font-sans">
      {/* Email Header */}
      <div className="border-b pb-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-100 p-2 rounded-full">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Letter Coach</h1>
            <p className="text-sm text-gray-600">Milestone Reminder</p>
          </div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold text-orange-900 mb-2">⏰ Milestone Check-In</h2>
          <p className="text-orange-700">
            You have an upcoming milestone deadline for your letter: "{selectedLetter.title}"
          </p>
        </div>
      </div>

      {/* Upcoming Milestone */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Coming Up Soon</h3>
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Build 3 full-stack projects</p>
              <p className="text-sm text-yellow-600">Due: September 1, 2024 (7 days remaining)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Overall Progress</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 line-through">Learn React and TypeScript</span>
            <Badge className="bg-green-100 text-green-800">Completed</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">Build 3 full-stack projects</span>
            <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-gray-500" />
            <span className="text-gray-700">Get a developer job</span>
            <Badge className="bg-gray-100 text-gray-600">Upcoming</Badge>
          </div>
        </div>
      </div>

      {/* Encouragement */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-lg text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">You're Doing Great! 💪</h3>
        <p className="mb-4 opacity-90">Stay focused on your goals. Every step forward counts!</p>
        <div className="bg-white text-green-600 py-3 px-6 rounded-lg font-semibold inline-block">
          Update Progress →
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
        <p>Letter Coach - Keeping you accountable to your future self</p>
      </div>
    </div>
  );

  const renderWelcomeEmail = () => (
    <div className="bg-white text-black p-8 rounded-lg shadow-lg max-w-2xl mx-auto font-sans">
      <div className="text-center mb-8">
        <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Letter Coach! 🎉</h1>
        <p className="text-gray-600">Your journey to a better future starts now</p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-blue-900 mb-3">What happens next?</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
            <p className="text-blue-800">Write your first letter to your future self</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
            <p className="text-blue-800">Set meaningful milestones and goals</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
            <p className="text-blue-800">Receive your letter when the time is right</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-8 rounded-lg font-semibold inline-block">
          Start Writing Your First Letter →
        </div>
      </div>
    </div>
  );

  const renderProgressUpdateEmail = () => (
    <div className="bg-white text-black p-8 rounded-lg shadow-lg max-w-2xl mx-auto font-sans">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📈 Weekly Progress Update</h1>
        <p className="text-gray-600">Here's how you're doing with your goals</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">This Week's Achievements 🎯</h2>
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
          <p className="text-green-800">✅ Completed milestone: "Learn React and TypeScript"</p>
          <p className="text-sm text-green-600 mt-1">Great work! You're 33% done with your "My 2024 Goals" letter.</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
        <div className="bg-gray-100 rounded-lg p-1 mb-2">
          <div className="bg-gradient-to-r from-green-500 to-green-400 h-4 rounded" style={{width: '33%'}}></div>
        </div>
        <p className="text-sm text-gray-600">1 of 3 milestones completed</p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg text-center">
        <h3 className="font-semibold text-blue-900 mb-2">Keep up the momentum!</h3>
        <p className="text-blue-700 mb-4">You're making great progress toward your future goals.</p>
        <div className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold inline-block">
          View Dashboard →
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">📧 Email Preview</h1>
              <p className="text-muted-foreground">
                Development tool to preview email templates
              </p>
            </div>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
              DEV ONLY
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Controls Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Template</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(emailTemplates).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedTemplate === 'letterDelivery' || selectedTemplate === 'milestoneReminder') && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sample Letter</label>
                    <Select value={selectedLetter.id} onValueChange={(id) => {
                      const letter = sampleLetters.find(l => l.id === id);
                      if (letter) setSelectedLetter(letter);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose letter" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleLetters.map((letter) => (
                          <SelectItem key={letter.id} value={letter.id}>{letter.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>Letter Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>Milestone Reminder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span>Welcome Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <span>Progress Update</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Preview */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {emailTemplates[selectedTemplate as keyof typeof emailTemplates]} Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-6 rounded-lg">
                  {renderEmailTemplate()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
