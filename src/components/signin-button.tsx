'use client';

import { useEcho } from '@merit-systems/echo-next-sdk/client';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export function SignInButton() {
  const { signIn } = useEcho();
  const [isSigningIn, setIsSigningIn] = useState(false);

  return (
    <Button
      onClick={() => {
        setIsSigningIn(true);
        signIn();
      }}
      disabled={isSigningIn}
      className="w-full"
      size="lg"
    >
      {isSigningIn ? (
        <>
          <Loader2 className="size-4 animate-spin mr-2" />
          Connecting...
        </>
      ) : (
        <>
          <Logo className="size-5 mr-2" />
          Connect with Echo
        </>
      )}
    </Button>
  );
}

