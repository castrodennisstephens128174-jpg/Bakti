export const dynamic = 'force-dynamic';

import { changeAllowanceStatus, getAllowance } from '@/server/controller/allowance.controller';
import { compose } from '@/server/middleware/compose';
import { withAuth } from '@/server/middleware/withAuth';
import { withError } from '@/server/middleware/withError';
import { withRateLimit } from '@/server/middleware/withRateLimit';

export const GET = compose(withError, withAuth)(getAllowance);
export const PATCH = compose(withError, withRateLimit, withAuth)(changeAllowanceStatus);
