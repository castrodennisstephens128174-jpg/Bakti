export const dynamic = 'force-dynamic';

import { getTransaction } from '@/server/controller/anchor-server.controller';
import { compose } from '@/server/middleware/compose';
import { withError } from '@/server/middleware/withError';

export const GET = compose(withError)(getTransaction);
