import { app } from './app';
import { env } from './infra/config/env';

app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));
