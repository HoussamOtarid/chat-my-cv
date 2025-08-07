import Link from 'next/link'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card'
import { MessageSquare, Shield, Sparkles } from 'lucide-react'

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Chat My CV
          </h1>
          <p className="text-xl text-muted-foreground">
            Intelligent conversational interface for your professional resume
          </p>
          
          <div className="flex justify-center gap-4 pt-8">
            <Button asChild size="lg">
              <Link href="/chat">Start Chatting</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/admin/login">Admin Login</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Natural Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ask questions about professional experience, skills, and achievements in natural language
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>AI-Powered</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Powered by advanced language models from OpenAI, Anthropic, or Google AI
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Secure & Private</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your resume data is encrypted and stored securely with role-based access control
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}