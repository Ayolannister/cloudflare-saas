import { useAuth } from '@clerk/react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../lib/api';
import { toastError } from '../stores/ui';

function createClient() {
  return new QueryClient({
    queryCache: new QueryCache(),
    mutationCache: new MutationCache({
      onError: (error) => toastError(error.message || 'Something went wrong. Try again.'),
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

/** Drops cached data whenever the signed-in user changes, so one account never sees another's data. */
function ClearOnUserChange({ client }: { client: QueryClient }) {
  const { userId } = useAuth();
  const previous = useRef(userId);
  useEffect(() => {
    if (previous.current !== userId) client.clear();
    previous.current = userId;
  }, [client, userId]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(createClient);
  return (
    <QueryClientProvider client={client}>
      <ClearOnUserChange client={client} />
      {children}
    </QueryClientProvider>
  );
}
