import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
console.log('Environment check:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
  keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
  serviceKeyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
  serviceKeyEnd: '...' + process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(-20)
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate input - second layer
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Creating user with email:', email);

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for development
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      // Handle specific auth errors
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      
      if (authError.message.includes('Password should be')) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: authError.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    console.log('User created successfully:', authData.user.id);

    // Now sign in the user to establish a client session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Sign-in error after signup:', signInError);
      // User was created but sign-in failed - still return success
      // User can manually sign in later
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please sign in.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          created_at: authData.user.created_at
        },
        needsSignIn: true
      }, { status: 201 });
    }

    // Return success response with session
    return NextResponse.json({
      success: true,
      message: 'Account created and signed in successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      },
      session: {
        access_token: signInData.session?.access_token,
        refresh_token: signInData.session?.refresh_token,
        expires_at: signInData.session?.expires_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
