export const dynamic = 'force-dynamic';

import { putCustomer } from '@/server/controller/anchor-server.controller';
import { compose } from '@/server/middleware/compose';
import { withError } from '@/server/middleware/withError';
import { withRateLimit } from '@/server/middleware/withRateLimit';

export const PUT = compose(withError, withRateLimit)(putCustomer);
