export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createAllowance, listAllowances } from '@/server/controller/allowance.controller';
import { compose } from '@/server/middleware/compose';
import { withAuth } from '@/server/middleware/withAuth';
import { withError } from '@/server/middleware/withError';
import { withRateLimit } from '@/server/middleware/withRateLimit';

export const GET = compose(withError, withAuth)(listAllowances);
export const POST = compose(withError, withRateLimit, withAuth)(createAllowance);
