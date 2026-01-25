// app/api/auth/set-role-cookie/route.js
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    console.log('🔐 Setting role cookie...');
    
    const session = await auth();
    
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userRole = session.user.role || 'User';
    console.log('✅ User role from session:', userRole);
    
    const response = NextResponse.json({ 
      success: true, 
      role: userRole 
    });
    
    // 🎯 THIS SETS THE COOKIE YOUR PROXY READS
    response.cookies.set({
      name: 'user-role',
      value: userRole,
      httpOnly: false, // Must be false for proxy to read
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour (match your session)
    });
    
    console.log('✅ user-role cookie set:', userRole);
    return response;
    
  } catch (error) {
    console.error('🔥 Error setting role cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set role cookie' },
      { status: 500 }
    );
  }
}