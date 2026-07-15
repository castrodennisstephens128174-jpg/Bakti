export const dynamic = 'force-dynamic';

import { payUri } from '@/server/controller/allowance.controller';
import { compose } from '@/server/middleware/compose';
import { withAuth } from '@/server/middleware/withAuth';
import { withError } from '@/server/middleware/withError';

export const GET = compose(withError, withAuth)(payUri);
