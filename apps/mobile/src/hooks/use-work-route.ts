import type { Href } from 'expo-router';
import { useMemo } from 'react';

import type { AccountRole } from '@/context/session-provider';

type RoutePathname = Extract<Href, { pathname: string }>['pathname'];

type WorkRouteParams = {
    currentRole: AccountRole;
};

export function useWorkRoute<TPathname extends RoutePathname>(
    pathname: TPathname,
    { currentRole }: WorkRouteParams,
) {
    return useMemo(
        () =>
            ({
                pathname,
                params: { currentRole },
            }) as const,
        [pathname, currentRole],
    );
}