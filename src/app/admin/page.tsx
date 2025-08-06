'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card'
import { Label } from '@/registry/new-york-v4/ui/label'
import { Input } from '@/registry/new-york-v4/ui/input'
import { Button } from '@/registry/new-york-v4/ui/button'
import { Textarea } from '@/registry/new-york-v4/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select'
import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface Configuration {
  llm_provider: string
  llm_model: string
  api_key: string
  system_prompt: string
  welcome_message: string
  theme_color: string
}

interface Provider {
  name: string
  models: { value: string; label: string }[]
  apiKeyLabel: string
  apiKeyPlaceholder: string
}

export default function AdminDashboard() {
  const [config, setConfig] = useState<Configuration>({
    llm_provider: '',
    llm_model: '',
    api_key: '',
    system_prompt: '',
    welcome_message: 'Hello! Upload your resume to get started.',
    theme_color: '#0ea5e9'
  })
  const [providers, setProviders] = useState<Record<string, Provider>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)

  useEffect(() => {
    fetchProviders()
    fetchConfiguration()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/admin/config/providers')
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
    }
  }

  const fetchConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateApiKey = async () => {
    if (!config.llm_provider || !config.api_key) {
      setMessage({ type: 'error', text: 'Please select a provider and enter an API key' })
      return
    }

    setValidating(true)
    setApiKeyValid(null)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/config/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.llm_provider,
          apiKey: config.api_key
        })
      })

      if (response.ok) {
        const { valid } = await response.json()
        setApiKeyValid(valid)
        setMessage({
          type: valid ? 'success' : 'error',
          text: valid ? 'API key is valid' : 'Invalid API key'
        })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to validate API key' })
    } finally {
      setValidating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully' })
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const selectedProvider = config.llm_provider ? providers[config.llm_provider] : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Configure your AI Resume Chat application</p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>LLM Configuration</CardTitle>
          <CardDescription>
            Configure your language model provider and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={config.llm_provider}
                onValueChange={(value) => {
                  setConfig({ ...config, llm_provider: value, llm_model: '' })
                  setApiKeyValid(null)
                }}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(providers).map(([key, provider]) => (
                    <SelectItem key={key} value={key}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={config.llm_model}
                onValueChange={(value) => setConfig({ ...config, llm_model: value })}
                disabled={!selectedProvider}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider?.models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">
              {selectedProvider?.apiKeyLabel || 'API Key'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="api-key"
                type="password"
                placeholder={selectedProvider?.apiKeyPlaceholder || 'Enter your API key'}
                value={config.api_key}
                onChange={(e) => {
                  setConfig({ ...config, api_key: e.target.value })
                  setApiKeyValid(null)
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={validateApiKey}
                disabled={validating || !config.llm_provider || !config.api_key}
              >
                {validating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Validate'
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
            <Textarea
              id="system-prompt"
              placeholder="Enter custom system prompt for the AI assistant..."
              value={config.system_prompt}
              onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat Settings</CardTitle>
          <CardDescription>
            Customize the chat interface and user experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea
              id="welcome-message"
              placeholder="Enter welcome message..."
              value={config.welcome_message}
              onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme-color">Theme Color</Label>
            <div className="flex gap-2">
              <Input
                id="theme-color"
                type="color"
                value={config.theme_color}
                onChange={(e) => setConfig({ ...config, theme_color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={config.theme_color}
                onChange={(e) => setConfig({ ...config, theme_color: e.target.value })}
                placeholder="#0ea5e9"
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || !config.llm_provider || !config.llm_model || !config.api_key}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </div>
    </div>
  )
}