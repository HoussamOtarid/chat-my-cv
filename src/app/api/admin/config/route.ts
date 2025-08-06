import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('configuration')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (!data) {
      return NextResponse.json({
        llm_provider: '',
        llm_model: '',
        api_key: '',
        system_prompt: '',
        welcome_message: 'Hello! Upload your resume to get started.',
        theme_color: '#0ea5e9'
      })
    }

    const decryptedApiKey = data.api_key ? await decrypt(data.api_key) : ''

    return NextResponse.json({
      ...data,
      api_key: decryptedApiKey
    })
  } catch (error) {
    console.error('Failed to fetch configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { llm_provider, llm_model, api_key, system_prompt, welcome_message, theme_color } = body

    if (!llm_provider || !llm_model || !api_key) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const encryptedApiKey = await encrypt(api_key)
    
    const supabase = await createSupabaseAdmin()
    
    const { data: existing } = await supabase
      .from('configuration')
      .select('id')
      .single()

    const configData = {
      llm_provider,
      llm_model,
      api_key: encryptedApiKey,
      system_prompt: system_prompt || null,
      welcome_message: welcome_message || 'Hello! Upload your resume to get started.',
      theme_color: theme_color || '#0ea5e9'
    }

    let result
    if (existing) {
      result = await supabase
        .from('configuration')
        .update(configData)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('configuration')
        .insert(configData)
        .select()
        .single()
    }

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({
      ...result.data,
      api_key: api_key
    })
  } catch (error) {
    console.error('Failed to update configuration:', error)
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    )
  }
}